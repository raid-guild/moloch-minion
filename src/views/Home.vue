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
      <MinionItem :minion="minion" />
    </v-row>

    <v-row align="center" justify="center">
      <v-col>
        <template>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field
              v-model="target"
              label="Target Address"
              required
            ></v-text-field>

            <v-text-field
              v-model="description"
              label="Short Description"
              required
            ></v-text-field>

            <v-textarea
              name="input-7-1"
              filled
              label="Data (Hex Encoded)"
              auto-grow
              value="The Woodman set to work at once, and so sharp was his axe that the tree was soon chopped nearly through."
            ></v-textarea>

            <v-checkbox
              v-model="checkbox"
              label="I'm ok with this"
              required
            ></v-checkbox>

            <v-btn color="success" class="mr-4" @click="addMinion">
              Submit
            </v-btn>
          </v-form>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import MinionItem from "../components/MinionItem";

export default {
  props: {
    source: String
  },
  components: { MinionItem },
  data: () => ({
    minions: [
      { id: 1, name: "minion 1" },
      { id: 2, name: "minion 2" }
    ],
    valid: true,
    target: "",
    description: "",
    checkbox: false
  }),
  methods: {
    addMinion() {
      const minion = {};
      minion.name = "new minion";
      this.minions.push(minion);
    }
  }
};
</script>
