<template>
  <div class="field">
    <div class="ui color">
      <input tabindex="0" type="color" v-model="data.value">
      <label>{{fromCamelCase(data.name)}}</label>
    </div>
  </div>
</template>

<script>
import fromCamelCase from '@/lib/fromCamelCase'

export default {
  name: 'ColorForm',
  props: ['name', 'data'],
  data () {
    return {}
  },
  methods: {
    fromCamelCase
  }
}
</script>

<style lang="sass" scoped>

</style>
