import React from "react";
import Helmet from "react-helmet";
import { connect } from "react-redux";

import Container from "./framework/container";
import Layout from "./framework/layout";
import Header from "./header";
import LeftSideBar from "./leftSidebar";
import RightSideBar from "./rightSidebar";
import Legend from "./continuousLegend";
import Graph from "./graph/graph";
import MenuBar from "./menubar";
import Autosave from "./autosave";
import Embedding from "./embedding";

import actions from "../actions";

@connect((state) => ({
  loading: state.controls.loading,
  error: state.controls.error,
  graphRenderCounter: state.controls.graphRenderCounter,
}))
class App extends React.Component {
  componentDidMount() {
    const { dispatch } = this.props;

    /* listen for url changes, fire one when we start the app up */
    window.addEventListener("popstate", this._onURLChanged);
    this._onURLChanged();

    dispatch(actions.doInitialDataLoad(window.location.search));
    this.forceUpdate();
  }

  _onURLChanged() {
    const { dispatch } = this.props;

    dispatch({ type: "url changed", url: document.location.href });
  }

  render() {
    const { loading, error, graphRenderCounter } = this.props;
    return (
      <Container>
        <Helmet title="CELL&times;GENE | Annotate" />
        {loading ? (
          <div
            style={{
              position: "fixed",
              fontWeight: 500,
              top: window.innerHeight / 2,
              left: window.innerWidth / 2 - 50,
            }}
          >
            loading cellxgene
          </div>
        ) : null}
        {error ? (
          <div
            style={{
              position: "fixed",
              fontWeight: 500,
              top: window.innerHeight / 2,
              left: window.innerWidth / 2 - 50,
            }}
          >
            error loading cellxgene
          </div>
        ) : null}
        {loading || error ? null : (
          <Layout>
            <Header />
            <LeftSideBar />
            {(viewportRef1) => (
              <>
                <MenuBar />
                <Embedding />
                <Autosave />
                <Legend id='legend1' viewportRef={viewportRef1} />
                <Graph key={graphRenderCounter} id='viewportRef1' viewportRef={viewportRef1} />
              </>
            )}
            {(viewportRef2) => (
              <>
                <MenuBar />
                <Embedding />
                <Autosave />
                <Legend id='legend2' viewportRef={viewportRef2} />
                <Graph key={graphRenderCounter} id='viewportRef2' viewportRef={viewportRef2} />
              </>
            )}
            <RightSideBar />
          </Layout>
        )}
      </Container>
    );
  }
}

export default App;
