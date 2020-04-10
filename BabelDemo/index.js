/**
 * @file wxml convert swan
 */
const transform = (filePath) => {
    /** 一、解析源码文件生成AST */
    const babel = require("@babel/core");
    const result = babel.transformFileSync(filePath, {
        presets: [
            "@babel/preset-typescript"
        ],
        plugins: [
            // "@babel/plugin-transform-react-jsx",
            // "@babel/plugin-proposal-class-properties"
        ],
        filename: filePath,
        ast: true
    });
    console.log('源代码\n', result.code);

    /** 二、遍历AST，转换api接口 */
    if (result && result.ast) {
        const { ast } = result;
        const types = require('@babel/types');
        const traverse = require('@babel/traverse').default;
        /**
         traverse(ast, {
            // 抽象语法树中所有满足节点类型为XXXNodeType将会执行该函数回调
            // 类型和对应数据结构可以通过https://astexplorer.net/查看
            XXXNodeType(XXXNodePath) {
                XXXNodePath.traverse({
                    XXXNodeType2(XXXNodePath2) {
                        // 嵌套即满足特定层级关系，可继续遍历
                        // 调用 types 相关方法可以新增一个节点，对已有节点覆盖即可完成修改功能，
                        // 注意，不能直接将抽象语法树节点赋值为空，这样会导致遍历崩溃。删除语句需要通过下面方法修改。
                        // 增加或删除语句，则需要找到语句父节点body数组进行增加或删除
                    }
                })
                // TODO 可直接修改 XXXNodePath.node 节点里面的属性值完成语法树修改
            }
        });
         **/
        traverse(ast, {
            ClassDeclaration(classDeclarationPath) {
                let hasShouldComponentUpdateMethod = false;
                // 查找是否有shouldComponentUpdate方法
                classDeclarationPath.traverse({
                    ClassMethod(methodDefinitionPath) {
                        if (methodDefinitionPath.node.key.name === 'render') {
                            // 删除render中的console.log
                            methodDefinitionPath.node.body.body = methodDefinitionPath.node.body.body.filter(expression => {
                                if (types.isExpressionStatement(expression)) {
                                    if (types.isMemberExpression(expression.expression.callee)) {
                                        if (expression.expression.callee.object.name === 'console' && expression.expression.callee.property.name === 'log') {
                                            return false;
                                        }
                                    }
                                }

                                return true;
                            });
                        } else {
                            if (methodDefinitionPath.node.key.name === 'shouldComponentUpdate') {
                                hasShouldComponentUpdateMethod = true;
                            }

                            // 在非 render 方法中加上输出日志
                            methodDefinitionPath.node.body.body = [
                                types.expressionStatement(
                                    types.callExpression(
                                        types.memberExpression(
                                            types.identifier('console'),
                                            types.identifier('log')
                                        ),
                                        [
                                            types.stringLiteral(methodDefinitionPath.node.key.name)
                                        ]
                                    )
                                ),
                                ...methodDefinitionPath.node.body.body
                            ]
                        }
                    }
                });
                if (!hasShouldComponentUpdateMethod) {
                    // 没有shouldComponentUpdate方法，则将superClass改成React.PureComponent
                    classDeclarationPath.node.superClass = types.memberExpression(
                        types.identifier('React'),
                        types.identifier('PureComponent')
                    );
                }
            }
        });

        /** 三、AST 转换成源码 **/
        const generate = require('@babel/generator').default;
        const { code } = generate(result.ast, {
            retainLines: true,
            retainFunctionParens: true,
            sourceMaps: false,
            decoratorsBeforeExport: true
        }) || {};
        console.log('转换后代码\n', code);
        // 源文件名加前缀"Babel_Transformed-"
        const fs = require('fs-extra');
        const outputFilePath = `${ filePath.substring(0, filePath.lastIndexOf('/') + 1) }Babel_Transformed-${ filePath.substring(filePath.lastIndexOf('/') + 1) }`;
        fs.writeFileSync(outputFilePath, code);
    }
};

transform('../HelloWorld.tsx');

