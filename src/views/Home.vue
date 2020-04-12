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
              :rules="targetRules"
              required
            ></v-text-field>

            <v-text-field
              v-model="description"
              label="Short Description"
              :rules="descriptionRules"
              required
            ></v-text-field>

            <v-textarea
              name="input-7-1"
              v-model="hexData"
              filled
              label="Data (Hex Encoded)"
              :rules="hexDataRules"
              auto-grow
              required
              value=""
            ></v-textarea>

            <v-checkbox
              v-model="checkbox"
              label="I'm ok with this"
              required
            ></v-checkbox>

            <v-btn color="success" class="mr-4" @click="submit">
              Submit
            </v-btn>
          </v-form>
        </template>
      </v-col>
    </v-row>
    <v-overlay :value="overlay">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
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
      { id: 1, name: "minion 1", desc: "" },
      { id: 2, name: "minion 2", desc: "" }
    ],
    overlay: false,
    valid: false,
    target: "",
    targetRules: [
      v => !!v || "Target is required",
      v =>
        (v && /^(0x){1}[0-9a-fA-F]{40}$/i.test(v)) || "Must be a valid address" // can use web3 checksum
    ],
    description: "",
    descriptionRules: [
      v => !!v || "Description is required",
      v => (v && v.length <= 200) || "Too Long"
    ],
    hexData: "",
    hexDataRules: [
      v => !!v || "Hex Data is required",
      v => (v && v.startsWith("0x")) || "Must start with 0x"
    ],
    checkbox: false
  }),
  methods: {
    submit() {
      if (!this.valid) {
        return false;
      }
      this.overlay = true;
      setTimeout(() => {
        this.overlay = false;
      }, 3000);
      //TODO: make web3 call
      const minion = {};
      minion.name = "new minion";
      minion.description = this.description;
      this.minions.push(minion);
    }
  }
};
</script>
