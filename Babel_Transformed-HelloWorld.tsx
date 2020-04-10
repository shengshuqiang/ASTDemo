import React, { Component } from 'react';
import { Text } from 'react-native';





// 如果没有shouldComponentUpdate, 则直接替换为继承PureComponent
// 删除render中的console.log
// 在其他方法加上输出日志
class HelloWorldComponent extends Component {
  shouldComponentUpdate() {console.log("shouldComponentUpdate");
    return true;
  }

  render() {

    return (
      <Text>Hello World</Text>);

  }}


class HelloWorld2Component extends React.PureComponent {
  render() {
    return (
      <Text>Hello World</Text>);

  }}