function Mvvm(options = {}) {
    this.$options = options
    let data = this._data = this.$options.data

    observe(data)
    for (let key in data) {
        Object.defineProperty(this, key, {
            configurable: true,
            get() {
                return this._data[key]
            },
            set(newValue) {
                this._data[key] = newValue
            }
        })
    }

    new Compile(options.el, this)
}

function Observe(data) {
    for (let key in data) {
        let val = data[key]
        observe(data[key])
        let dep = new Dep()
        Object.defineProperty(data, key, {
            configurable: true,
            get() {
                Dep.target && dep.addSubs(Dep.target)
                return val
            },
            set(newValue) {
                if (val === newValue) {
                    return
                }
                val = newValue
                observe(newValue)
                dep.notify()
            }
        })
    }
}

function observe(data) {
    if (!data || typeof data !== 'object') return
    new Observe(data)
}

function Compile(el, vm) {
    vm.$el = document.querySelector(el)
    let fragment = document.createDocumentFragment()

    while (child = vm.$el.firstChild) {
        fragment.appendChild(child)
    }

    function replace(frag) {
        Array.from(frag.childNodes).forEach(node => {
            let txt = node.textContent
            let reg = /\{\{(.*?)\}\}/g
            if (node.nodeType === 3 && reg.test(txt)) {
                // let exp = RegExp.$1
                // let expArr = txt.match(reg)
                // let arr = exp.split('.')
                // let val = vm
                // arr.forEach(key => {
                //     val = val[key]
                // })
                // node.textContent = node.textContent.replace(reg, val).trim()
                // console.log(expArr)
                let expArr = txt.match(reg)
                let tempTxt = txt
                expArr.forEach(exp => {
                    // reg.test(exp)
                    // let expCatch = RegExp.$1
                    expCatch = exp.replace('{{', '').replace('}}', '')
                    let arr = expCatch.split('.')
                    let val = vm
                    arr.forEach(key => {
                        val = val[key]
                    })
                    tempTxt = tempTxt.replace(exp, val).trim()
                    node.textContent = tempTxt
                })
                new Watcher(expArr, vm, (newTextContent) => {
                    let tempTxt = txt
                    newTextContent.forEach(item => {
                        tempTxt = tempTxt.replace(item.exp, item.value)
                    })
                    node.textContent = tempTxt
                })
            }
            if (node.nodeType === 1) {
                let attributes = node.attributes
                Array.from(attributes).forEach(attr => {
                    let name = attr.name
                    let value = attr.value
                    if (name.includes('v-')) {
                        let arr = value.split('.')
                        let val = vm
                        arr.forEach(key => {
                            val = val[key]
                        })
                        node.value = val
                        new Watcher([value], vm, (newTextContent) => {
                            let tempValue = value
                            newTextContent.forEach(item => {
                                tempValue = tempValue.replace(item.exp, item.value)
                            })
                            node.value = tempValue
                        })
                        node.addEventListener('input', e => {
                            let newValue = e.target.value
                            let execStr = 'vm.' + value + ' = ' + "'" + newValue + "'"
                            eval(execStr)
                        })
                    }
                })
            }
            if (node.childNodes.length && node.nodeType !== 3) {
                replace(node)
            }
        })
    }

    replace(fragment)

    vm.$el.appendChild(fragment)
}

function Watcher(expArr, vm, fn) {
    this.fn = fn
    this.expArr = expArr
    this.vm = vm
    Dep.target = this
    expArr.forEach(exp => {
        let expCatch = exp.replace('{{', '').replace('}}', '').trim()
        let arr = expCatch.split('.')
        let val = this.vm
        arr.forEach(key => {
            val = val[key]
        })
    })

    Dep.target = null
}

Watcher.prototype.update = function() {
    let replaceArr = []
    this.expArr.forEach(exp => {
        let expCatch = exp.replace('{{', '').replace('}}', '').trim()
        let arr = expCatch.split('.')
        let val = this.vm
        arr.forEach(key => {
            val = val[key]
        })
        replaceArr.push({
            exp,
            value: val
        })
    })
    this.fn(replaceArr)
}

function Dep() {
    this.subs = []
}

Dep.prototype = {
    addSubs(watcher) {
        this.subs.push(watcher)
    },
    notify() {
        this.subs.forEach(watcher => {
            watcher.update()
        })
    }
}