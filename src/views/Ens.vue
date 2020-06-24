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
      <vue-tabs style="width: 400px; min-width: 300px;">
        <v-tab title="Register">
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
              <v-btn color="success" class="mr-4" @click="submit">
                Submit
              </v-btn>
            </v-form>
          </v-col>
        </v-tab>
        <v-tab title="Assigned Subdomains" style="margin-top: 20px">
          <template v-for="(subdomain) in processedSubdomains">
            <p :key="subdomain.name">
              <b>{{ subdomain.name }}:</b> {{ subdomain.owner }}
            </p>
          </template>
        </v-tab>
      </vue-tabs>
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
  import { VueTabs, VTab } from "vue-nav-tabs";
  import "vue-nav-tabs/themes/vue-tabs.css";
  export default {
    props: {
      domains: Array,
      subdomains: Array,
    },
    components: { VueTabs, VTab },
    computed: {
      domainItems: function () {
        return this.domains.map(d => `${d.domain}.eth`)
      },
      processedSubdomains: function () {
        return this.subdomains.map(s => {
          const domainName = this.domains.find(d => d.label === s.label).domain
          const subdomainName = `${s.subdomain}.${domainName}.eth`
          return {
            name: subdomainName,
            owner: s.owner
          }
        })
      }
    },
    data: () => ({
      domain: "",
      subdomain: "",
      subdomainItems: [],
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
        const currentDomain = this.domains.find(d => d.domain === this.domain)
        this.subdomainItems = this.subdomains
                     .filter(s => s.label === currentDomain.label)
                     .map(s => s.subdomain)
      },
      submit() {
        if (!this.valid) {
          alert("Invalid Inputs");
          return false;
        }

        if (this.subdomainItems.includes(this.subdomain)) {
          alert("Subdomain already registered")
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
