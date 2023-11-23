/* rc slider https://www.npmjs.com/package/rc-slider */

import React from "react";
import { connect } from "react-redux";
import { AnchorButton, Collapse, H4 } from "@blueprintjs/core";
import Gene from "../geneExpression/gene";

@connect((state) => ({
  schema: state.annoMatrix?.schema,
}))
class Continuous extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      contOpen: true,
    };
  }
  render() {
    /* initial value for iterator to simulate index, ranges is an object */
    const { schema } = this.props;
    const { contOpen } = this.state;
    if (!schema) return null;
    const obsIndex = schema.annotations.obs.index;
    const allContinuousNames = schema.annotations.obs.columns
      .filter((col) => col.type === "int32" || col.type === "float32")
      .filter((col) => col.name !== obsIndex)
      .filter((col) => !col.writable) // skip user annotations - they will be treated as categorical
      .map((col) => col.name);

    return (
      <div>
        <hr />
        <AnchorButton
          onClick={() => {
            this.setState({
              contOpen: !contOpen,
            });
          }}
          text={
            <span>
              <H4>Continuous</H4>
            </span>
          }
          fill
          minimal
          rightIcon={contOpen ? "chevron-down" : "chevron-right"}
          small
        />
        <Collapse isOpen={contOpen}>
          {allContinuousNames.map((key) => (
            <Gene
              key={key}
              gene={key}
              isObs
            />
          ))}
        </Collapse>
      </div>
    );
  }
}

export default Continuous;
