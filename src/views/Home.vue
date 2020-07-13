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
    <v-row v-if="!sortedMinions.length" align="center" justify="center"
      >No Minion Proposals yet.</v-row
    >
    <v-row
      align="center"
      justify="center"
      v-for="(minion, idx) in sortedMinions"
      :key="idx"
    >
      <MinionItem
        :minion="minion"
        :events="events"
        :execute="execute"
        :actionDetails="actionDetails"
      />
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
  computed: {
    sortedMinions() {
      return this.minions.slice().reverse();
    }
  },
  components: { MinionItem },
  methods: {
    execute(id) {
      this.$emit("executed", id);
    },
    actionDetails(id) {
      this.$emit("actionDetails", id);
    }
  }
};
</script>
