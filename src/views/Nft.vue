<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <v-col cols="5">
        <v-img
          :src="require('../assets/smiling-face-with-horns.png')"
          contain
          height="200"
        ></v-img>
      </v-col>
    </v-row>
    <v-row align="center" justify="center">
      <v-col cols="5">
        <h1>Mint Welcome Token</h1>
        <v-form ref="form" v-model="valid" lazy-validation>
          <v-text-field
            v-model="to"
            label="Mint NFT To"
            :rules="toRules"
            required
          ></v-text-field>
          <v-btn color="success" class="mr-4" @click="submit">
            Submit
          </v-btn>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data: () => ({
    to: "",
    toRules: [
      v => !!v || "To is required",
      v =>
        (v && /^(0x){1}[0-9a-fA-F]{40}$/i.test(v)) || "Must be a valid address", // can use web3 checksum
      v =>
        (v && v !== "0x0000000000000000000000000000000000000000") ||
        "To cannot be a null address"
    ],
    valid: false
  }),
  methods: {
    submit() {
      if (!this.valid) {
        alert("Invalid Inputs");
        return false;
      }

      const request = {
        to: this.to
      };
      this.$emit("mintedNFT", request);
    }
  }
};
</script>
