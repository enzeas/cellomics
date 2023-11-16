import React from "react";
import { connect } from "react-redux";
import * as globals from "../../globals";

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedLi: 0, // 初始化为null，表示没有<li>被选中
    };
  }
  handleLiClick(index) {
    this.setState({ selectedLi: index }); // 更新选中的<li>
  }
  render() {
    const liStyle = index => ({
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      //border: "1px solid grey",
      padding: "10px",
      //width: "200px",
      //height: "inherit",
      fontSize: "24px",
      fontWeight: "bold",
      cursor: "pointer", // 设置鼠标形状为小手
      backgroundColor:
        this.state.selectedLi === index ? "lightskyblue" : "inherit", // 如果<li>被选中，设置背景颜色为lightgreen
    });
    return (
      <div
        style={{
          /* x y blur spread color */
          borderLeft: `1px solid ${globals.lightGrey}`,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflowY: "inherit",
          height: "inherit",
          width: "inherit",
          padding: globals.leftSidebarSectionPadding,
          // backgroundColor: "dodgerblue", // 添加Header的背景颜色
        }}
      >
        <ul
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            height: "inherit",
            listStyle: "none", // 移除前面的小黑点
            // minWidth: "1200px",
          }}
        >
          <li style={liStyle(0)} onClick={() => this.handleLiClick(0)}>CellInfo vs GeneExpr</li>
          <li style={liStyle(1)} onClick={() => this.handleLiClick(1)}>GeneExpr vs GeneExpr</li>
          <li style={liStyle(2)} onClick={() => this.handleLiClick(2)}>Gene coexpression</li>
          <li style={liStyle(3)} onClick={() => this.handleLiClick(3)}>Violinplot / Boxplot</li>
          <li style={liStyle(4)} onClick={() => this.handleLiClick(4)}>Proportion plot</li>
          <li style={liStyle(5)} onClick={() => this.handleLiClick(5)}>Bubbleplot / Heatmap</li>
        </ul>
      </div>
    );
  }
}

export default Header;
