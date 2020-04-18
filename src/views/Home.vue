<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="5">
        <v-img
          :src="require('../assets/smiling-face-with-horns.png')"
          contain
          height="200"
        ></v-img>
      </v-col>
    </v-row>

    <v-row
      align="center"
      justify="center"
      v-for="(minion, idx) in minions"
      :key="idx"
    >
      <MinionItem :minion="minion" :events="events" :execute="execute" />
    </v-row>
  </v-container>
</template>

<script>
import MinionItem from "../components/MinionItem";

export default {
  props: {
    source: String,
    minions: Array,
    events: Array
  },
  components: { MinionItem },
  methods: {
    execute(id) {
      this.$emit("executed", id);
    }
  }
};
</script>
