<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <h2>ESCROW MAKER</h2>
    </v-row>
    <v-row align="center" justify="center">
      <v-col cols="5">
        <v-img
          :src="require('../assets/smiling-face-with-horns.png')"
          contain
          height="100"
        ></v-img>
      </v-col>
    </v-row>
    <v-row align="center" justify="center">
      <v-tabs
        dark
        fixed-tabs
        v-model="tabs"
        style="width:100%; min-width:300px; flex:none"
      >
        <v-tab>New</v-tab>
        <v-tab>List</v-tab>
      </v-tabs>
    </v-row>
    <v-row align="center" justify="center">
      <v-tabs-items v-model="tabs" style="width:100%; min-width:300px">
        <v-tab-item>
          <v-row>
            <v-col xs="8">
              <v-form ref="form" v-model="valid" lazy-validation>
                <v-text-field
                  v-model="clientName"
                  label="Client Name"
                  :rules="clientNameRules"
                  required
                ></v-text-field>
                <v-text-field
                  v-model="escrowName"
                  label="Sprint Name"
                  :rules="escrowNameRules"
                  required
                ></v-text-field>
                <v-text-field
                  v-model="escrowLink"
                  label="Link to deal"
                  :rules="escrowLinkRules"
                  required
                ></v-text-field>
                <v-text-field
                  v-model="provider"
                  label="Provider (Multisig) Address"
                  :rules="providerRules"
                  required
                ></v-text-field>
                <v-text-field
                  v-model="token"
                  label="Payment Token"
                  :rules="tokenRules"
                  required
                ></v-text-field>
                <v-text-field
                  v-model="amount"
                  label="Amount to pay at milestone (cap/milestones)"
                  :rules="amountRules"
                  required
                ></v-text-field>
                <v-text-field
                  v-model="cap"
                  label="Total deposit"
                  :rules="capRules"
                  required
                ></v-text-field>
                <v-text-field
                  v-model="milestones"
                  label="How Many Milestones"
                  :rules="milestonesRules"
                  required
                ></v-text-field>
                <v-menu
                  v-model="menu"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  min-width="290px"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-model="termination"
                      label="Contract Termination Date"
                      readonly
                      v-bind="attrs"
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="termination"
                    @input="menu = false"
                  ></v-date-picker>
                </v-menu>
                <v-textarea
                  v-model="description"
                  label="More description "
                  required
                ></v-textarea>
              </v-form>
            </v-col>
            <v-col>
              <h1>Preview Deal</h1>
              <p>Client: {{ clientName }}</p>
              <p>Sprint: {{ escrowName }}</p>
              <p>Description: {{ description }}</p>
              <p>Link to Deal: {{ escrowLink }}</p>
              <p>
                A deposit of {{ cap || "_______" }} in (token:
                {{ token || "_______" }}) will be held in this escrow
              </p>
              <p>bla bla bla</p>
              <v-btn color="success" class="mr-4" @click="submit">
                Submit
              </v-btn>
            </v-col>
          </v-row>
        </v-tab-item>
        <v-tab-item>
          <template v-for="escrow in escrowList">
            <p :key="escrow.name" style="margin:0 5px 16px">
              <a
                link
                @click="
                  $router.push(
                    `/escrow-detail/${escrow.clientName}/${$route.params.minion}`
                  )
                "
                ><b>{{ escrow.escrowName }}:</b> {{ escrow.clientName }}</a
              >
            </p>
          </template>
        </v-tab-item>
      </v-tabs-items>
    </v-row>
  </v-container>
</template>

<script>
export default {
  props: {
    escrowList: Array,
    minionAddr: String
  },
  computed: {},
  data: () => ({
    clientName: "",
    escrowName: "",
    escrowLink: "",
    provider: "",
    token: "",
    amount: "",
    cap: "",
    milestones: "",
    termination: new Date().toISOString().substr(0, 10),
    details: "",
    description: "",
    clientNameRules: [v => true],
    escrowNameRules: [v => true],
    escrowLinkRules: [v => true],
    providerRules: [
      v => !!v || "Subdomain is required",
      v =>
        (v && !v.includes(".") && !v.includes(" ")) ||
        "Subdomain must not contain periods or spaces"
    ],

    tokenRules: [
      v => !!v || "Owner is required",
      v =>
        (v && /^(0x){1}[0-9a-fA-F]{40}$/i.test(v)) || "Must be a valid address", // can use web3 checksum
      v =>
        (v && v !== "0x0000000000000000000000000000000000000000") ||
        "Owner cannot be a null address"
    ],
    amountRules: [v => true],
    capRules: [v => true],
    milestonesRules: [v => true],
    terminationRules: [v => true],
    tabs: null,
    valid: false,
    menu: false
  }),
  methods: {
    submit() {
      if (!this.valid) {
        alert("Invalid Inputs");
        return false;
      }
    }
  }
};
</script>
