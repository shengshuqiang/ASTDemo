const transform = (fromFile) => {
    const path = require('path');
    const fs = require('fs-extra');
    const ts = require("typescript");

    // 相对路径转换成绝对路径
    const fromFilePath = path.resolve(__dirname, fromFile);
    // 从文件读取字符串
    const sourceCode = fs.readFileSync(fromFilePath).toString();
    console.log('源代码\n', sourceCode);
    // 源码字符转AST
    let sourceFile = ts.createSourceFile(
        '',
        sourceCode,
        ts.ScriptTarget.ES2016,
        true,
        ts.ScriptKind.TSX
    );
    sourceFile = ts.transform(sourceFile,
        [
            (ctx) => (sourceFile) => {
                // 访问当前节点
                return ts.visitNode(sourceFile, function visitor(node) {
                    // TODO 判断节点条件，并且做相关处理
                    // 如果满足特定类型节点，调用ts.updateXXX返回新节点即可完成对该节点更改
                    // 通过操作语句父节点statements数组可增加或者删除语句

                    // 遍历子节点，因为在visitor函数中调用visitor，完成节点递归遍历
                    return ts.visitEachChild(node, visitor, ctx);
                });
            },
            // 如果没有shouldComponentUpdate, 则直接替换为继承PureComponent
            (ctx) => (sourceFile) => {
                return ts.visitNode(sourceFile, function visitor(node) {
                    // 过滤类声明类型节点
                    if (ts.isClassDeclaration(node)) {
                        let hasShouldComponentUpdateMethod = false;
                        // 遍历节点，查找是否有 shouldComponentUpdate 方法
                        ts.visitNode(node, function visitor2(node) {
                            if (ts.isMethodDeclaration(node)) {
                                const { name } = node;
                                if (ts.isIdentifier(name) && name.text === 'shouldComponentUpdate') {
                                    hasShouldComponentUpdateMethod = true;
                                }
                            }
                            return ts.visitEachChild(node, visitor2, ctx);
                        });
                        if (!hasShouldComponentUpdateMethod) {
                            // 遍历节点，找到父类名称Component并且修改为React.PureComponent
                            return ts.visitNode(node, function visitor2(node) {
                                if (ts.isHeritageClause(node)) {
                                    return ts.visitNode(node, function visitor3(node) {
                                        if (ts.isExpressionWithTypeArguments(node) && ts.isIdentifier(node.expression) && node.expression.text === 'Component') {
                                            return ts.updateExpressionWithTypeArguments(
                                                node,
                                                node.typeArguments,
                                                ts.createPropertyAccess(
                                                    ts.createIdentifier('React'),
                                                    ts.createIdentifier('PureComponent'),
                                                )
                                            );
                                        }
                                        return ts.visitEachChild(node, visitor3, ctx);
                                    });
                                }
                                return ts.visitEachChild(node, visitor2, ctx);
                            });
                        }
                    }
                    return ts.visitEachChild(node, visitor, ctx);
                });
            },
            // 删除render中的console.log
            (ctx) => (sourceFile) => {
                return ts.visitNode(sourceFile, function visitor(node) {
                    if (ts.isMethodDeclaration(node)) {
                        const { name } = node;
                        if (ts.isIdentifier(name) && name.text === 'render') {
                            // 删除console.log
                            return ts.visitNode(node, function visitor2(node) {
                                if (ts.isBlock(node)) {
                                    return ts.updateBlock(
                                        node,
                                        node.statements.filter(statement => {
                                            if (ts.isExpressionStatement(statement)) {
                                                const { expression } = statement;
                                                if (ts.isCallExpression(expression)) {
                                                    const { expression: expression2 } = expression;
                                                    if (ts.isPropertyAccessExpression(expression2)) {
                                                        const { expression: expression3, name } = expression2;
                                                        if (ts.isIdentifier(expression3) && expression3.text === 'console'
                                                            && ts.isIdentifier(name) && name.text === 'log') {
                                                            return false;
                                                        }
                                                    }
                                                }
                                            }

                                            return true;
                                        })
                                    );
                                }
                                return ts.visitEachChild(node, visitor2, ctx);
                            });
                        }
                    }
                    return ts.visitEachChild(node, visitor, ctx);
                });
            },
            // 在其他方法加上输出日志
            (ctx) => (sourceFile) => {
                return ts.visitNode(sourceFile, function visitor(node) {
                    if (ts.isMethodDeclaration(node)) {
                        const { name } = node;
                        if (ts.isIdentifier(name) && name.text !== 'render') {
                            // 增加console.log
                            return ts.visitNode(node, function visitor2(node) {
                                if (ts.isBlock(node)) {
                                    return ts.updateBlock(
                                        node,
                                        [
                                            ts.createStatement(
                                                ts.createCall(
                                                    ts.createPropertyAccess(
                                                        ts.createIdentifier('console'),
                                                        ts.createIdentifier('log')
                                                    ),
                                                    undefined,
                                                    [
                                                        ts.createStringLiteral(name.text)
                                                    ]
                                                )
                                            ),
                                            ...node.statements
                                        ]
                                    );
                                }
                                return ts.visitEachChild(node, visitor2, ctx);
                            });
                        }
                    }
                    return ts.visitEachChild(node, visitor, ctx);
                });
            }
        ]
    ).transformed[0];

    const transformedCode = ts.createPrinter({
        removeComments: false,
        newLine: 1,
        omitTrailingSemicolon: false,
        noEmitHelpers: false
    }).printFile(sourceFile);

    console.log('转换后代码\n', transformedCode);

    const outputFilePath = `${ fromFilePath.substring(0, fromFilePath.lastIndexOf('/') + 1) }Typescript_Transformed-${ fromFilePath.substring(fromFilePath.lastIndexOf('/') + 1) }`;
    fs.writeFileSync(outputFilePath, transformedCode);
};

transform('../HelloWorld.tsx');

