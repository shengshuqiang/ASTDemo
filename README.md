# ASTDemo
抽象语法树实战

有两种方式操作语法树，babel 和 typescript。 babel 只能将 AST 还原为 js 代码，相关 ts 语法会丢失，但是 typescript 可以做到。

本Demo以对 HelloWorld.tsx 进行增删改来说明脚本如何使用。

* 如果class中没有shouldComponentUpdate, 则直接替换为继承PureComponent（改）。

* 删除render方法中的console.log（删）。

* 在非render方法中加上输出日志（增）。

## BabelDemo



## TypescriptDemo
