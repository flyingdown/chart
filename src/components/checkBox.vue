<template>
    <div class="chooser-component">
        <ul class="chooser-list">
            <li v-for="(selection, index) in selections" :class="{active: isCheck(index)}" @click="chooseOrNot(index)">
                {{ selection.label }}
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    props: {
        selections: {
            type: Array,
            default: [
                {
                    label: 'test',
                    value: 0
                }
            ]
        }
    },
    data () {
        return {
            currentIndexes: [0]
        }
    },
    watch: {
        currentIndexes () {
            let currSelections = []
            for (let i in this.currentIndexes) {
                currSelections.push(this.selections[this.currentIndexes[i]])
            }
            console.log(currSelections)
            this.$emit('onChange', currSelections)
        }
    },
    methods: {
        isCheck (index) {
            for (let i in this.currentIndexes) {
                if (index === this.currentIndexes[i]) {
                    return true
                }
            }

            return false
        },
        chooseOrNot (index) {
            for (let i in this.currentIndexes) {
                if (index === this.currentIndexes[i]) {
                    this.currentIndexes.splice(i, 1)
                    return
                }
            }

            this.currentIndexes.push(index)
        }
    }
}
</script>

<style scoped>
.chooser-component {
  position: relative;
  display: inline-block;
}
.chooser-list li{
  display: inline-block;
  border: 1px solid #e3e3e3;
  height: 25px;
  line-height: 25px;
  padding: 0 8px;
  margin-right: 5px;
  border-radius: 3px;
  text-align: center;
  cursor: pointer;
}
.chooser-list li.active {
  border-color: #4fc08d;
  background: #4fc08d;
  color: #fff;
}
</style>
