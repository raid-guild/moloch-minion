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

    <v-row v-if="domainItems.length" align="center" justify="center">
      <v-container style="width: 400px; min-width: 300px;">
        <v-col xs="8">
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-select
              label="Select Domain"
              :items="domainItems"
              @change="chooseDomain"
            ></v-select>
            <v-text-field
              v-model="subdomain"
              label="Request Subdomain"
              :rules="subdomainRules"
              required
            ></v-text-field>
            <v-text-field
              v-model="owner"
              label="Subdomain Owner"
              :rules="ownerRules"
              required
            ></v-text-field>
            <v-checkbox
              v-model="checkbox"
              label="I'm ok with this"
              required
            ></v-checkbox>
            <v-btn color="success" class="mr-4" @click="submit">
              Submit
            </v-btn>
          </v-form>
        </v-col>
      </v-container>
    </v-row>

    <v-row v-else align="center" justify="center">
      <v-col cols="5">
        <h1>ENS Subdomain Registrar</h1>
        <p>
          Subdomains can be requested after configuring a domain in the Minion Subdomain Registrar contract.
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  export default {
    props: {
      domains: Array
    },
    computed: {
      domainItems: function () {
        return this.domains.map(d => `${d.domain}.eth`)
      },
    },
    data: () => ({
      checkbox: false,
      domain: "",
      subdomain: "",
      subdomainRules: [
        v => !!v || "Subdomain is required",
        v => (v && !v.includes('.') && !v.includes(' ')) || "Subdomain must not contain periods or spaces"
      ],
      owner: "",
      ownerRules: [
        v => !!v || "Owner is required",
        v => (v && /^(0x){1}[0-9a-fA-F]{40}$/i.test(v)) || "Must be a valid address", // can use web3 checksum
        v => (v && v !== "0x0000000000000000000000000000000000000000") || "Owner cannot be a null address"
      ],
      valid: false
    }),
    methods: {
      chooseDomain: function (item) {
        this.domain = item.replace('.eth', '')
      },
      submit() {
        if (!this.valid) {
          alert("Invalid Inputs");
          return false;
        }

        const request = {
          domain: this.domain,
          subdomain: this.subdomain,
          owner: this.owner
        }
        this.$emit("registered", request);
      }
    }
  };
</script>
