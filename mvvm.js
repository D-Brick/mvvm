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
                Dep.target && dep.addSub(Dep.target)
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
                // console.log(RegExp.$1)
                let arr = RegExp.$1.split('.')
                let val = vm
                arr.forEach(key => {
                    val = val[key]
                })
                node.textContent = txt.replace(reg, val).trim()
                new Watcher(vm, RegExp.$1, newVal => {
                    node.textContent = txt.replace(reg, newVal).trim()
                })
            }
            if (node.nodeType === 1) {
                let attributes = node.attributes
                Array.from(attributes).forEach(attr => {
                    let name = attr.name
                    let exp = attr.value
                    if (name.includes('v-')) {
                        let val = vm
                        let arr = exp.split('.')
                        arr.forEach(key => {
                            val = val[key]
                        })
                        node.value = val

                        new Watcher(vm, exp, (newVal) => {
                            node.value = newVal
                        })
                        node.addEventListener('input', e => {
                            let newVal = e.target.value
                            let arr = exp.split('.')
                            let str = 'vm'
                            arr.forEach(key => {
                                str+=`['${key}']`
                            })
                            console.log(96, str)
                            eval(str + '=' + newVal)
                        })
                    }
                })
            }
            if (node.childNodes && node.childNodes.length) {
                replace(node)
            }
        })
    }

    replace(fragment)

    vm.$el.appendChild(fragment)
}

function Dep() {
    this.subs = []
}

Dep.prototype = {
    addSub(sub) {
        this.subs.push(sub)
    },
    notify() {
        this.subs.forEach(sub => {
            sub.update()
        })
    }
}

function Watcher(vm, exp, fn) {
    this.fn = fn
    this.vm = vm
    this.exp = exp
    
    Dep.target = this
    let arr = exp.split('.')
    let val = vm
    arr.forEach(key => {
        val = val[key]
    })
    Dep.target = this
}
Watcher.prototype = {
    update() {
        let arr = this.exp.split('.')
        let val = this.vm
        arr.forEach(key => {
            val = val[key]
        })
        this.fn(val)
    }
}

// let watcher = new Watcher(() => console.log(111))
// let dep = new Dep()
// dep.addSub(watcher)
// dep.addSub(watcher)
// dep.notify()

