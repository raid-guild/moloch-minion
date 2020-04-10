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
      :key="minion"
      v-for="minion in minions"
    >
      <MinionItem :minion="minion" />
    </v-row>

    <v-row align="center" justify="center">
      <v-col>
        <template>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field
              v-model="name"
              :counter="10"
              :rules="nameRules"
              label="Target Address"
              required
            ></v-text-field>

            <v-text-field
              v-model="name"
              :counter="10"
              :rules="nameRules"
              label="Detail"
              required
            ></v-text-field>
            <v-text-field
              v-model="name"
              :counter="10"
              :rules="nameRules"
              label="Hex Code"
              required
            ></v-text-field>

            <v-checkbox
              v-model="checkbox"
              :rules="[v => !!v || 'You must agree to continue!']"
              label="Do you agree?"
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
    minions: [{ name: "minion 1" }, { name: "minion 2" }]
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
