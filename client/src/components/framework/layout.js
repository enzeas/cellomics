import React from "react";
import * as globals from "../../globals";

class Layout extends React.Component {
  /*
    Layout - this react component contains all the layout style and logic for the application once it has loaded.

    The layout is based on CSS grid: the left and right sidebars have fixed widths, the graph in the middle takes the
    remaining space.

    Note, the renderGraph child is a function rather than a fully-instantiated element because the middle pane of the
    app is dynamically-sized. It must have access to the containing viewport in order to know how large the graph
    should be.
  */

  componentDidMount() {
    /*
      This is a bit of a hack. In order for the graph to size correctly, it needs to know the size of the parent
      viewport. Unfortunately, it can only do this once the parent div has been rendered, so we need to render twice.
    */
    this.forceUpdate();
  }

  render() {
    const { children } = this.props;
    const [header, leftSidebar, renderGraph, renderGraph2, rightSidebar] =
      children;
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `
          [left-sidebar-start] ${globals.leftSidebarWidth + 1}px
          [left-sidebar-end graph-start] 1fr
          [graph-end graph2-start] 1fr
          [graph2-end right-sidebar-start] ${globals.rightSidebarWidth + 1}px 
          [right-sidebar-end]
        `,
          gridTemplateRows: `[top] ${
            globals.headerHeight + 1
          }px [mid] auto [bottom]`,
          gridTemplateAreas: `
          "header header header header"
          "left-sidebar graph graph2 right-sidebar"
          `,
          columnGap: "0px",
          justifyItems: "stretch",
          alignItems: "stretch",
          height: "inherit",
          width: "inherit",
          position: "relative",
          top: 0,
          left: 0,
          minWidth: "1240px",
        }}
      >
        <div
          style={{
            gridArea: "top / left-sidebar-start / mid / right-sidebar-end",
            position: "relative",
            height: "inherit",
            overflowY: "auto",
          }}
        >
          {header}
        </div>
        <div
          style={{
            gridArea: "mid / left-sidebar-start / bottom / left-sidebar-end",
            position: "relative",
            height: "inherit",
            overflowY: "auto",
          }}
        >
          {leftSidebar}
        </div>
        <div
          style={{
            zIndex: 0,
            gridArea: "mid / graph-start / bottom / graph-end",
            position: "relative",
            height: "inherit",
          }}
          ref={(ref) => {
            this.viewportRef = ref;
          }}
        >
          {this.viewportRef ? renderGraph(this.viewportRef) : null}
        </div>
        <div
          style={{
            zIndex: 0,
            gridArea: "mid / graph2-start / bottom / graph2-end",
            position: "relative",
            height: "inherit",
          }}
        >
          {this.viewportRef2 ? renderGraph2(this.viewportRef2) : null}
        </div>
        <div
          style={{
            gridArea: "mid / right-sidebar-start / bottom / right-sidebar-end",
            position: "relative",
            height: "inherit",
            overflowY: "auto",
          }}
        >
          {rightSidebar}
        </div>
      </div>
    );
  }
}

export default Layout;
