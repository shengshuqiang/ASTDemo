import React, { Component, ReactElement } from 'react';
import { Text } from 'react-native';

interface Props {
  msg: string
}

// 如果没有shouldComponentUpdate, 则直接替换为继承PureComponent
// 删除render中的console.log
// 在其他方法加上输出日志
class HelloWorldComponent extends Component<Props> {
  shouldComponentUpdate(): boolean {
    return true;
  }

  render(): ReactElement {
    console.log('render');
    return (
        <Text>Hello World</Text>
    );
  }
}

class HelloWorld2Component extends Component<Props> {
  render(): ReactElement {
    return (
      <Text>Hello World</Text>
    );
  }
}
