import React from "react";
import { connect } from "react-redux";

import { Button, Icon } from "@blueprintjs/core";
import Truncate from "../util/truncate";
import HistogramBrush from "../brushableHistogram";

import actions from "../../actions";

const MINI_HISTOGRAM_WIDTH = 110;

@connect((state, ownProps) => {
  const { gene } = ownProps;

  return {
    isColorAccessor: state.colors.colorAccessor === gene,
    isScatterplotXXaccessor: state.controls.scatterplotXXaccessor === gene,
    isScatterplotYYaccessor: state.controls.scatterplotYYaccessor === gene,
  };
})
class Gene extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      geneIsExpanded: false,
    };
  }

  onColorChangeClick = (e) => {
    const { dispatch, gene, isObs } = this.props;
    console.log(this);
    if (isObs) {
      dispatch({
        type: "color by continuous metadata",
        colorAccessor: gene,
      });
    } else {
      dispatch(actions.requestSingleGeneExpressionCountsForColoringPOST(gene));
    }
    e.stopPropagation();
  };

  handleGeneExpandClick = (e) => {
    const { geneIsExpanded } = this.state;
    this.setState({ geneIsExpanded: !geneIsExpanded });
    e.stopPropagation();
  };

  handleSetGeneAsScatterplotX = (e) => {
    const { dispatch, gene, isObs } = this.props;
    dispatch({
      type: "set scatterplot x",
      data: gene,
      isObs: isObs,
    });
    e.stopPropagation();
  };

  handleSetGeneAsScatterplotY = (e) => {
    const { dispatch, gene, isObs } = this.props;
    dispatch({
      type: "set scatterplot y",
      data: gene,
      isObs: isObs,
    });
    e.stopPropagation();
  };

  handleDeleteGeneFromSet = () => {
    const { dispatch, gene, geneset } = this.props;
    dispatch(actions.genesetDeleteGenes(geneset, [gene]));
  };

  render() {
    const {
      gene,
      geneDescription,
      isColorAccessor,
      isScatterplotXXaccessor,
      isScatterplotYYaccessor,
      quickGene,
      removeGene,
      isObs,
    } = this.props;
    const { geneIsExpanded } = this.state;
    let geneSymbolWidth;
    if (isObs) {
      geneSymbolWidth = 60 + geneIsExpanded ? MINI_HISTOGRAM_WIDTH : 40;
    } else {
      geneSymbolWidth = 60 + geneIsExpanded ? MINI_HISTOGRAM_WIDTH : 0;
    }

    return (
      <div>
        <div
          style={{
            marginLeft: 5,
            marginRight: 0,
            marginTop: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            role="menuitem"
            tabIndex="0"
            data-testclass="gene-expand"
            data-testid={`${gene}:gene-expand`}
            onKeyPress={() => {}}
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div>
              <Truncate
                tooltipAddendum={geneDescription && `: ${geneDescription}`}
              >
                <span
                  style={{
                    width: geneSymbolWidth,
                    display: "inline-block",
                  }}
                  data-testid={`${gene}:gene-label`}
                >
                  {gene}
                </span>
              </Truncate>
            </div>
            {!geneIsExpanded ? (
              <HistogramBrush
                isUserDefined
                field={gene}
                mini
                width={MINI_HISTOGRAM_WIDTH - (isObs ? 40 : 0)}
                isObs={isObs}
              />
            ) : null}
          </div>
          <div style={{ flexShrink: 0, marginLeft: 2 }}>
            {isObs || (
              <Button
                minimal
                small
                data-testid={`delete-from-geneset:${gene}`}
                onClick={
                  quickGene ? removeGene(gene) : this.handleDeleteGeneFromSet
                }
                intent="none"
                style={{ fontWeight: 700, marginRight: 2 }}
                icon={<Icon icon="trash" iconSize={10} />}
              />
            )}
            <Button
              minimal
              small
              data-testid={`plot-x-${gene}`}
              onClick={this.handleSetGeneAsScatterplotX}
              active={isScatterplotXXaccessor}
              intent={isScatterplotXXaccessor ? "primary" : "none"}
              style={{ fontWeight: 700, marginRight: 2 }}
            >
              x
            </Button>
            <Button
              minimal
              small
              data-testid={`plot-y-${gene}`}
              onClick={this.handleSetGeneAsScatterplotY}
              active={isScatterplotYYaccessor}
              intent={isScatterplotYYaccessor ? "primary" : "none"}
              style={{ fontWeight: 700, marginRight: 2 }}
            >
              y
            </Button>
            <Button
              minimal
              small
              data-testclass="maximize"
              data-testid={`maximize-${gene}`}
              onClick={this.handleGeneExpandClick}
              active={geneIsExpanded}
              intent="none"
              icon={<Icon icon="maximize" iconSize={10} />}
              style={{ marginRight: 2 }}
            />
            <Button
              minimal
              small
              data-testclass="colorby"
              data-testid={`colorby-${gene}`}
              onClick={this.onColorChangeClick}
              active={isColorAccessor}
              intent={isColorAccessor ? "primary" : "none"}
              icon={<Icon icon="tint" iconSize={12} />}
            />
          </div>
        </div>
        {geneIsExpanded && <HistogramBrush isUserDefined field={gene} isObs={isObs}/>}
      </div>
    );
  }
}

export default Gene;
