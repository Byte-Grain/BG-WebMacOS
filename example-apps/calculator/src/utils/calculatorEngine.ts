/**
 * 计算器引擎类
 * 负责处理数学表达式的解析和计算
 */
export class CalculatorEngine {
  private operators: Record<string, { precedence: number; associativity: 'left' | 'right'; fn: (a: number, b: number) => number }> = {
    '+': {
      precedence: 1,
      associativity: 'left',
      fn: (a, b) => a + b
    },
    '-': {
      precedence: 1,
      associativity: 'left',
      fn: (a, b) => a - b
    },
    '*': {
      precedence: 2,
      associativity: 'left',
      fn: (a, b) => a * b
    },
    '×': {
      precedence: 2,
      associativity: 'left',
      fn: (a, b) => a * b
    },
    '/': {
      precedence: 2,
      associativity: 'left',
      fn: (a, b) => {
        if (b === 0) throw new Error('除零错误')
        return a / b
      }
    },
    '÷': {
      precedence: 2,
      associativity: 'left',
      fn: (a, b) => {
        if (b === 0) throw new Error('除零错误')
        return a / b
      }
    },
    '^': {
      precedence: 3,
      associativity: 'right',
      fn: (a, b) => Math.pow(a, b)
    }
  }

  private functions: Record<string, (x: number) => number> = {
    sin: (x) => Math.sin(x * Math.PI / 180),
    cos: (x) => Math.cos(x * Math.PI / 180),
    tan: (x) => Math.tan(x * Math.PI / 180),
    log: (x) => {
      if (x <= 0) throw new Error('对数的真数必须大于0')
      return Math.log10(x)
    },
    ln: (x) => {
      if (x <= 0) throw new Error('自然对数的真数必须大于0')
      return Math.log(x)
    },
    sqrt: (x) => {
      if (x < 0) throw new Error('负数不能开平方根')
      return Math.sqrt(x)
    },
    abs: (x) => Math.abs(x),
    ceil: (x) => Math.ceil(x),
    floor: (x) => Math.floor(x),
    round: (x) => Math.round(x)
  }

  private constants: Record<string, number> = {
    pi: Math.PI,
    e: Math.E
  }

  /**
   * 计算数学表达式
   * @param expression 数学表达式字符串
   * @returns 计算结果
   */
  evaluate(expression: string): number {
    try {
      // 预处理表达式
      const processedExpression = this.preprocessExpression(expression)
      
      // 词法分析
      const tokens = this.tokenize(processedExpression)
      
      // 语法分析并计算
      const result = this.evaluateTokens(tokens)
      
      // 检查结果有效性
      if (!isFinite(result)) {
        throw new Error('计算结果无效')
      }
      
      return result
    } catch (error) {
      throw new Error(`计算错误: ${error.message}`)
    }
  }

  /**
   * 预处理表达式
   * @param expression 原始表达式
   * @returns 处理后的表达式
   */
  private preprocessExpression(expression: string): string {
    return expression
      .replace(/\s+/g, '') // 移除空格
      .replace(/×/g, '*')   // 替换乘号
      .replace(/÷/g, '/')   // 替换除号
      .replace(/π/g, 'pi')  // 替换π
      .replace(/e(?![a-z])/gi, 'e') // 替换e（确保不是其他单词的一部分）
  }

  /**
   * 词法分析 - 将表达式分解为标记
   * @param expression 表达式
   * @returns 标记数组
   */
  private tokenize(expression: string): string[] {
    const tokens: string[] = []
    let i = 0

    while (i < expression.length) {
      const char = expression[i]

      if (/\d/.test(char) || char === '.') {
        // 数字（包括小数）
        let number = ''
        while (i < expression.length && (/\d/.test(expression[i]) || expression[i] === '.')) {
          number += expression[i]
          i++
        }
        tokens.push(number)
      } else if (/[a-zA-Z]/.test(char)) {
        // 函数名或常数
        let name = ''
        while (i < expression.length && /[a-zA-Z]/.test(expression[i])) {
          name += expression[i]
          i++
        }
        tokens.push(name)
      } else if (this.operators[char]) {
        // 运算符
        tokens.push(char)
        i++
      } else if (char === '(' || char === ')') {
        // 括号
        tokens.push(char)
        i++
      } else {
        // 未知字符
        throw new Error(`未知字符: ${char}`)
      }
    }

    return tokens
  }

  /**
   * 使用调度场算法计算表达式
   * @param tokens 标记数组
   * @returns 计算结果
   */
  private evaluateTokens(tokens: string[]): number {
    const outputQueue: (number | string)[] = []
    const operatorStack: string[] = []

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]

      if (this.isNumber(token)) {
        // 数字直接加入输出队列
        outputQueue.push(parseFloat(token))
      } else if (this.constants[token]) {
        // 常数
        outputQueue.push(this.constants[token])
      } else if (this.functions[token]) {
        // 函数
        operatorStack.push(token)
      } else if (this.operators[token]) {
        // 运算符
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== '(' &&
          (
            this.functions[operatorStack[operatorStack.length - 1]] ||
            (
              this.operators[operatorStack[operatorStack.length - 1]] &&
              (
                this.operators[operatorStack[operatorStack.length - 1]].precedence > this.operators[token].precedence ||
                (
                  this.operators[operatorStack[operatorStack.length - 1]].precedence === this.operators[token].precedence &&
                  this.operators[token].associativity === 'left'
                )
              )
            )
          )
        ) {
          outputQueue.push(operatorStack.pop()!)
        }
        operatorStack.push(token)
      } else if (token === '(') {
        // 左括号
        operatorStack.push(token)
      } else if (token === ')') {
        // 右括号
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
          outputQueue.push(operatorStack.pop()!)
        }
        if (operatorStack.length === 0) {
          throw new Error('括号不匹配')
        }
        operatorStack.pop() // 移除左括号
        
        // 如果栈顶是函数，则弹出
        if (operatorStack.length > 0 && this.functions[operatorStack[operatorStack.length - 1]]) {
          outputQueue.push(operatorStack.pop()!)
        }
      } else {
        throw new Error(`未知标记: ${token}`)
      }
    }

    // 将剩余的运算符弹出到输出队列
    while (operatorStack.length > 0) {
      const op = operatorStack.pop()!
      if (op === '(' || op === ')') {
        throw new Error('括号不匹配')
      }
      outputQueue.push(op)
    }

    // 计算后缀表达式
    return this.evaluatePostfix(outputQueue)
  }

  /**
   * 计算后缀表达式
   * @param postfix 后缀表达式
   * @returns 计算结果
   */
  private evaluatePostfix(postfix: (number | string)[]): number {
    const stack: number[] = []

    for (const token of postfix) {
      if (typeof token === 'number') {
        stack.push(token)
      } else if (this.operators[token]) {
        if (stack.length < 2) {
          throw new Error('运算符缺少操作数')
        }
        const b = stack.pop()!
        const a = stack.pop()!
        const result = this.operators[token].fn(a, b)
        stack.push(result)
      } else if (this.functions[token]) {
        if (stack.length < 1) {
          throw new Error('函数缺少参数')
        }
        const a = stack.pop()!
        const result = this.functions[token](a)
        stack.push(result)
      } else {
        throw new Error(`未知操作: ${token}`)
      }
    }

    if (stack.length !== 1) {
      throw new Error('表达式格式错误')
    }

    return stack[0]
  }

  /**
   * 检查是否为数字
   * @param token 标记
   * @returns 是否为数字
   */
  private isNumber(token: string): boolean {
    return /^\d*\.?\d+$/.test(token)
  }

  /**
   * 格式化数字显示
   * @param num 数字
   * @param precision 精度
   * @returns 格式化后的字符串
   */
  formatNumber(num: number, precision: number = 10): string {
    if (!isFinite(num)) {
      return 'Error'
    }

    // 科学计数法阈值
    if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return num.toExponential(6)
    }

    // 整数
    if (Number.isInteger(num)) {
      return num.toString()
    }

    // 小数
    const fixed = num.toFixed(precision)
    return parseFloat(fixed).toString()
  }

  /**
   * 验证表达式语法
   * @param expression 表达式
   * @returns 是否有效
   */
  validateExpression(expression: string): { valid: boolean; error?: string } {
    try {
      const processedExpression = this.preprocessExpression(expression)
      const tokens = this.tokenize(processedExpression)
      
      // 检查括号匹配
      let parenthesesCount = 0
      for (const token of tokens) {
        if (token === '(') {
          parenthesesCount++
        } else if (token === ')') {
          parenthesesCount--
          if (parenthesesCount < 0) {
            return { valid: false, error: '括号不匹配' }
          }
        }
      }
      
      if (parenthesesCount !== 0) {
        return { valid: false, error: '括号不匹配' }
      }

      // 检查运算符和操作数的配对
      // 这里可以添加更多的语法检查

      return { valid: true }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  }
}