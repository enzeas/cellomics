import React from "react";
import { connect } from "react-redux";
import {
  ButtonGroup,
  AnchorButton,
  Slider,
  Tooltip,
  Dialog,
  ControlGroup,
  MenuItem,
} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select"

import * as globals from "../../globals";
import styles from "./menubar.css";
import actions from "../../actions";
import Clip from "./clip";

import Subset from "./subset";
import UndoRedoReset from "./undoRedo";
import DiffexpButtons from "./diffexpButtons";
import { getEmbSubsetView } from "../../util/stateManager/viewStackHelpers";
import * as chromatic from "d3-scale-chromatic";
import * as d3 from "d3";

const continuous = (selectorId, colorScale) => {
  const legendHeight = 30;
  const legendWidth = 300;

  const canvas = d3
    .select(selectorId)
    .style("height", `${legendHeight}px`)
    .style("width", `${legendWidth}px`)
    .append("canvas")
    .attr("width", legendWidth)
    .attr("height", 1)
    .style("height", `${legendHeight}px`)
    .style("width", `${legendWidth}px`)
    .style("background","#ccc")
    .node();

  const ctx = canvas.getContext("2d");

  const legendScale = d3
    .scaleLinear()
    .range([1, legendWidth])
    .domain([
      colorScale.domain()[1],
      colorScale.domain()[0],
    ]); 

  const image = ctx.createImageData(legendWidth, 1);
  d3.range(legendWidth).forEach((i) => {
    const c = d3.rgb(colorScale(legendScale.invert(i)));
    image.data[4 * i] = c.r;
    image.data[4 * i + 1] = c.g;
    image.data[4 * i + 2] = c.b;
    image.data[4 * i + 3] = 255;
  });
  ctx.putImageData(image, 0, 0);

};

@connect((state) => {
  const { annoMatrix } = state;
  const crossfilter = state.obsCrossfilter;
  const selectedCount = crossfilter.countSelected();

  const subsetPossible =
    selectedCount !== 0 && selectedCount !== crossfilter.size(); // ie, not all and not none are selected
  const embSubsetView = getEmbSubsetView(annoMatrix);
  const subsetResetPossible = !embSubsetView
    ? annoMatrix.nObs !== annoMatrix.schema.dataframe.nObs
    : annoMatrix.nObs !== embSubsetView.nObs;

  return {
    subsetPossible,
    subsetResetPossible,
    graphInteractionMode: state.controls.graphInteractionMode,
    clipPercentileMin: Math.round(100 * (annoMatrix?.clipRange?.[0] ?? 0)),
    clipPercentileMax: Math.round(100 * (annoMatrix?.clipRange?.[1] ?? 1)),
    userDefinedGenes: state.controls.userDefinedGenes,
    colorAccessor: state.colors.colorAccessor,
    scatterplotXXaccessor: state.controls.scatterplotXXaccessor,
    scatterplotYYaccessor: state.controls.scatterplotYYaccessor,
    libraryVersions: state.config?.library_versions,
    undoDisabled: state["@@undoable/past"].length === 0,
    redoDisabled: state["@@undoable/future"].length === 0,
    aboutLink: state.config?.links?.["about-dataset"],
    disableDiffexp: state.config?.parameters?.["disable-diffexp"] ?? false,
    diffexpMayBeSlow:
      state.config?.parameters?.["diffexp-may-be-slow"] ?? false,
    showCentroidLabels: state.centroidLabels.showLabels,
    tosURL: state.config?.parameters?.about_legal_tos,
    privacyURL: state.config?.parameters?.about_legal_privacy,
    categoricalSelection: state.categoricalSelection,
    pointScaler: state.controls.pointScaler,
    chromeKeyContinuous: state.controls.chromeKeyContinuous,
    chromeKeyCategorical: state.controls.chromeKeyCategorical,
    chromeKeys: Object.keys(chromatic).filter((item)=>item.startsWith("interpolate")).map((item)=>item.replace("interpolate","")).sort(),
  };
})
class MenuBar extends React.PureComponent {
  static isValidDigitKeyEvent(e) {
    /*
    Return true if this event is necessary to enter a percent number input.
    Return false if not.

    Returns true for events with keys: backspace, control, alt, meta, [0-9],
    or events that don't have a key.
    */
    if (e.key === null) return true;
    if (e.ctrlKey || e.altKey || e.metaKey) return true;

    // concept borrowed from blueprint's numericInputUtils:
    // keys that print a single character when pressed have a `key` name of
    // length 1. every other key has a longer `key` name (e.g. "Backspace",
    // "ArrowUp", "Shift"). since none of those keys can print a character
    // to the field--and since they may have important native behaviors
    // beyond printing a character--we don't want to disable their effects.
    const isSingleCharKey = e.key.length === 1;
    if (!isSingleCharKey) return true;

    const key = e.key.charCodeAt(0) - 48; /* "0" */
    return key >= 0 && key <= 9;
  }

  constructor(props) {
    super(props);
    this.state = {
      pendingClipPercentiles: null,
      preferencesDialogOpen: false,
    };
  }

  componentDidUpdate = (prevProps) => {
    const { chromeKeyCategorical, chromeKeyContinuous } =
      this.props;

    if (chromeKeyCategorical !== prevProps.chromeKeyCategorical) {
      d3.select("#categorical_legend_preferences").selectAll("*").remove();
      continuous(
        "#categorical_legend_preferences",
        d3
          .scaleSequential(chromatic[`interpolate${chromeKeyCategorical}`])
          .domain([0, 1])
      );
    }
    if (chromeKeyContinuous !== prevProps.chromeKeyContinuous) {
      d3.select("#continuous_legend_preferences").selectAll("*").remove();
      continuous(
        "#continuous_legend_preferences",
        d3
          .scaleSequential(chromatic[`interpolate${chromeKeyContinuous}`])
          .domain([0, 1])
      );
    }
  };

  isClipDisabled = () => {
    /*
    return true if clip button should be disabled.
    */
    const { pendingClipPercentiles } = this.state;
    const clipPercentileMin = pendingClipPercentiles?.clipPercentileMin;
    const clipPercentileMax = pendingClipPercentiles?.clipPercentileMax;
    const {
      clipPercentileMin: currentClipMin,
      clipPercentileMax: currentClipMax,
    } = this.props;

    // if you change this test, be careful with logic around
    // comparisons between undefined / NaN handling.
    const isDisabled =
      !(clipPercentileMin < clipPercentileMax) ||
      (clipPercentileMin === currentClipMin &&
        clipPercentileMax === currentClipMax);

    return isDisabled;
  };

  handleClipOnKeyPress = (e) => {
    /*
    allow only numbers, plus other critical keys which
    may be required to make a number
    */
    if (!MenuBar.isValidDigitKeyEvent(e)) {
      e.preventDefault();
    }
  };

  handleClipPercentileMinValueChange = (v) => {
    /*
    Ignore anything that isn't a legit number
    */
    if (!Number.isFinite(v)) return;

    const { pendingClipPercentiles } = this.state;
    const clipPercentileMax = pendingClipPercentiles?.clipPercentileMax;

    /*
    clamp to [0, currentClipPercentileMax]
    */
    if (v <= 0) v = 0;
    if (v > 100) v = 100;
    const clipPercentileMin = Math.round(v); // paranoia
    this.setState({
      pendingClipPercentiles: { clipPercentileMin, clipPercentileMax },
    });
  };

  handleClipPercentileMaxValueChange = (v) => {
    /*
    Ignore anything that isn't a legit number
    */
    if (!Number.isFinite(v)) return;

    const { pendingClipPercentiles } = this.state;
    const clipPercentileMin = pendingClipPercentiles?.clipPercentileMin;

    /*
    clamp to [0, 100]
    */
    if (v < 0) v = 0;
    if (v > 100) v = 100;
    const clipPercentileMax = Math.round(v); // paranoia

    this.setState({
      pendingClipPercentiles: { clipPercentileMin, clipPercentileMax },
    });
  };

  handleClipCommit = () => {
    const { dispatch } = this.props;
    const { pendingClipPercentiles } = this.state;
    const { clipPercentileMin, clipPercentileMax } = pendingClipPercentiles;
    const min = clipPercentileMin / 100;
    const max = clipPercentileMax / 100;
    dispatch(actions.clipAction(min, max));
  };

  handleClipOpening = () => {
    const { clipPercentileMin, clipPercentileMax } = this.props;
    this.setState({
      pendingClipPercentiles: { clipPercentileMin, clipPercentileMax },
    });
  };

  handleClipClosing = () => {
    this.setState({ pendingClipPercentiles: null });
  };

  handleCentroidChange = () => {
    const { dispatch, showCentroidLabels } = this.props;

    dispatch({
      type: "show centroid labels for category",
      showLabels: !showCentroidLabels,
    });
  };

  handleSubset = () => {
    const { dispatch } = this.props;
    dispatch(actions.subsetAction());
  };

  handleSubsetReset = () => {
    const { dispatch } = this.props;
    dispatch(actions.resetSubsetAction());
  };

  render() {
    const {
      dispatch,
      disableDiffexp,
      undoDisabled,
      redoDisabled,
      selectionTool,
      clipPercentileMin,
      clipPercentileMax,
      graphInteractionMode,
      showCentroidLabels,
      categoricalSelection,
      colorAccessor,
      subsetPossible,
      subsetResetPossible,
      pointScaler,
      chromeKeyContinuous,
      chromeKeyCategorical,
      chromeKeys,
    } = this.props;
    const { preferencesDialogOpen, pendingClipPercentiles } = this.state;

    const isColoredByCategorical = !!categoricalSelection?.[colorAccessor];

    // constants used to create selection tool button
    const [selectionTooltip, selectionButtonIcon] =
      selectionTool === "brush"
        ? ["Brush selection", "Lasso selection"]
        : ["select", "polygon-filter"];

    return (
      <div
        style={{
          position: "absolute",
          right: -100,
          top: 0,
          display: "flex",
          flexDirection: "row-reverse",
          alignItems: "flex-start",
          flexWrap: "wrap",
          justifyContent: "flex-start",
          zIndex: 3,
        }}
      >
        <Tooltip
          content="Preferences"
          position="bottom"
          hoverOpenDelay={globals.tooltipHoverOpenDelay}
        >
          <AnchorButton
            className={styles.menubarButton}
            icon="cog"
            onClick={() => {
              this.setState({ preferencesDialogOpen: true });
            }}
          />
        </Tooltip>
        <Dialog
          title="Preferences"
          isOpen={preferencesDialogOpen}
          onClose={() => {
            this.setState({ preferencesDialogOpen: false });
          }}
          onOpened={() => {
            d3.select("#categorical_legend_preferences")
              .selectAll("*")
              .remove();
            continuous(
              "#categorical_legend_preferences",
              d3
                .scaleSequential(
                  chromatic[`interpolate${chromeKeyCategorical}`]
                )
                .domain([0, 1])
            );

            d3.select("#continuous_legend_preferences").selectAll("*").remove();
            continuous(
              "#continuous_legend_preferences",
              d3
                .scaleSequential(chromatic[`interpolate${chromeKeyContinuous}`])
                .domain([0, 1])
            );
          }}
        >
          <div
            style={{
              margin: "0 auto",
              paddingTop: "10px",
              width: "90%",
            }}
          >
            <ControlGroup fill={true} vertical={false}>
              <span style={{ width: "160px", paddingRight: "10px" }}>
                Point size scaler:
              </span>
              <Slider
                min={0.0}
                max={10.0}
                stepSize={0.1}
                labelStepSize={5.0}
                showTrackFill={false}
                onChange={(value) => {
                  dispatch({
                    type: "set point scaler",
                    scaler: Math.max(0.01, value),
                  });
                }}
                value={pointScaler}
              />
            </ControlGroup>
            <div style={{ paddingTop: "20px", paddingBottom: "5px" }}>
              <b>Categorical colorscale:</b>
            </div>
            <ControlGroup fill={true} vertical={false}>
              <Select
                items={chromeKeys}
                filterable={false}
                itemRenderer={(d, { handleClick }) => {
                  return <MenuItem onClick={handleClick} key={d} text={d} />;
                }}
                onItemSelect={(d) => {
                  dispatch({ type: "set chrome key categorical", key: d });
                }}
              >
                <AnchorButton
                  text={`${chromeKeyCategorical}`}
                  rightIcon="double-caret-vertical"
                />
              </Select>
              <div id="categorical_legend_preferences" />
            </ControlGroup>
            <div style={{ paddingTop: "20px", paddingBottom: "5px" }}>
              <b>Continuous colorscale:</b>
            </div>
            <ControlGroup fill={true} vertical={false}>
              <Select
                items={chromeKeys}
                filterable={false}
                itemRenderer={(d, { handleClick }) => {
                  return <MenuItem onClick={handleClick} key={d} text={d} />;
                }}
                onItemSelect={(d) => {
                  dispatch({ type: "set chrome key continuous", key: d });
                }}
              >
                <AnchorButton
                  text={`${chromeKeyContinuous}`}
                  rightIcon="double-caret-vertical"
                />
              </Select>
              <div id="continuous_legend_preferences" />
            </ControlGroup>
          </div>
        </Dialog>
        <UndoRedoReset
          dispatch={dispatch}
          undoDisabled={undoDisabled}
          redoDisabled={redoDisabled}
        />
        {false && (
          <Clip
            pendingClipPercentiles={pendingClipPercentiles}
            clipPercentileMin={clipPercentileMin}
            clipPercentileMax={clipPercentileMax}
            handleClipOpening={this.handleClipOpening}
            handleClipClosing={this.handleClipClosing}
            handleClipCommit={this.handleClipCommit}
            isClipDisabled={this.isClipDisabled}
            handleClipOnKeyPress={this.handleClipOnKeyPress}
            handleClipPercentileMaxValueChange={
              this.handleClipPercentileMaxValueChange
            }
            handleClipPercentileMinValueChange={
              this.handleClipPercentileMinValueChange
            }
          />
        )}
        <Tooltip
          content="When a category is colored by, show labels on the graph"
          position="bottom"
          disabled={graphInteractionMode === "zoom"}
        >
          <AnchorButton
            className={styles.menubarButton}
            type="button"
            data-testid="centroid-label-toggle"
            icon="property"
            onClick={this.handleCentroidChange}
            active={showCentroidLabels}
            intent={showCentroidLabels ? "primary" : "none"}
            disabled={!isColoredByCategorical}
          />
        </Tooltip>
        <ButtonGroup className={styles.menubarButton}>
          <Tooltip
            content={selectionTooltip}
            position="bottom"
            hoverOpenDelay={globals.tooltipHoverOpenDelay}
          >
            <AnchorButton
              type="button"
              data-testid="mode-lasso"
              icon={selectionButtonIcon}
              active={graphInteractionMode === "select"}
              onClick={() => {
                dispatch({
                  type: "change graph interaction mode",
                  data: "select",
                });
              }}
            />
          </Tooltip>
          <Tooltip
            content="Drag to pan, scroll to zoom"
            position="bottom"
            hoverOpenDelay={globals.tooltipHoverOpenDelay}
          >
            <AnchorButton
              type="button"
              data-testid="mode-pan-zoom"
              icon="zoom-in"
              active={graphInteractionMode === "zoom"}
              onClick={() => {
                dispatch({
                  type: "change graph interaction mode",
                  data: "zoom",
                });
              }}
            />
          </Tooltip>
        </ButtonGroup>
        <Subset
          subsetPossible={subsetPossible}
          subsetResetPossible={subsetResetPossible}
          handleSubset={this.handleSubset}
          handleSubsetReset={this.handleSubsetReset}
        />
        {disableDiffexp ? null : <DiffexpButtons />}
      </div>
    );
  }
}

export default MenuBar;
