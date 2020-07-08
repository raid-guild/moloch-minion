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
      <v-tabs
        dark
        fixed-tabs
        v-model="tabs"
        style="width:400px; min-width:300px; flex:none"
      >
        <v-tab>ABI Selector</v-tab>
        <v-tab>Raw Bytes</v-tab>
      </v-tabs>
    </v-row>
    <v-row align="center" justify="center">
      <v-tabs-items v-model="tabs" style="width:400px; min-width:300px">
        <v-tab-item>
          <v-col xs="8">
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
              <v-select
                label="Select ABI"
                :items="abiItems"
                @change="chooseABI"
              ></v-select>
              <v-textarea
                v-if="!selectedABI"
                name="input-7-1"
                v-model="abiData"
                filled
                label="ABI String"
                :rules="abiStringRules"
                required
                value=""
                @change="getFunctions"
              ></v-textarea>
              <v-select
                label="Functions"
                v-model="selectedFunction"
                :items="abiFunctions"
                @change="chooseFunction"
              ></v-select>
              <template v-for="(input, idx) in inputs">
                <p :key="input.name">
                  {{ input.name }} (type: {{ input.type }})
                </p>
                <v-text-field
                  :id="idx.toString()"
                  :key="input.id"
                  @keyup="setParam"
                ></v-text-field>
              </template>
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
        </v-tab-item>
        <v-tab-item>
          <v-col xs="8">
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
          </v-col>
        </v-tab-item>
      </v-tabs-items>
    </v-row>
  </v-container>
</template>
<script>
export default {
  props: {
    overlay: String,
    minions: Array,
    web3: Object
  },
  data: () => ({
    valid: false,
    tabs: null,
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
    selectedABI: null,
    selectedFunction: null,
    inputs: [],
    inputValues: [],
    abis: {
      CertNFT: require("../abi/certnft.json"),
      "Compound cToken": require("../abi/ctoken.json"),
      "ENS Registrar": require("../abi/ens_registrar.json"),
      ERC20: require("../abi/erc20.json"),
      ERC721: require("../abi/erc721.json"),
      Minion: require("../abi/minion.json"),
      "Minion Subdomain Registrar": require("../abi/minion_subdomain_registrar.json"),
      "Moloch v1": require("../abi/moloch_v1.json"),
      "Moloch v1 Pool": require("../abi/moloch_v1_pool.json"),
      "Moloch v2": require("../abi/moloch_v2.json"),
      "Moloch v2 GuildBank": require("../abi/moloch_v2_guildbank.json"),
      "Uniswap v2 Router": require("../abi/uniswap_v2_router.json")
    },
    abiItems: [
      "Custom ABI",
      "CertNFT",
      "Compound cToken",
      "ENS Registrar",
      "ERC20",
      "ERC721",
      "Minion",
      "Minion Subdomain Registrar",
      "Moloch v1",
      "Moloch v1 Pool",
      "Moloch v2",
      "Moloch v2 GuildBank",
      "Uniswap v2 Router"
    ],
    abiFunctions: [],
    abiData: "",
    abiStringRules: [
      v => {
        try {
          JSON.parse(v);
        } catch (e) {
          return "invalid ABI string";
        }
        return true;
      }
    ],
    checkbox: false
  }),
  methods: {
    chooseABI(contractName) {
      if (contractName === "Custom ABI") {
        this.selectedABI = null;
      } else {
        this.selectedABI = contractName;
        this.getFunctions(this.abis[contractName]);
      }
    },
    chooseFunction(fName) {
      this.inputs = [];
      this.inputValues = [];
      const func = this.abiFunctions.find(({ name }) => name === fName);
      this.selectedFunction = func;
      this.inputs = func.inputs;
      this.inputValues.length = func.inputs.length;
    },
    getFunctions(abiParam) {
      this.hexData = "";
      this.selectedFunction = null;
      this.inputs = [];
      this.inputValues = [];
      let abi;
      if (typeof abiParam === "object") {
        abi = abiParam;
      } else {
        try {
          abi = JSON.parse(abiParam);
        } catch (e) {
          // let validation handle errors
          return [];
        }
      }
      this.abiFunctions = abi
        .filter(({ type, constant }) => type === "function" && !constant)
        .map((f, id) => ({ ...f, text: f.name, id }));
    },
    setParam({ target: { id, value } }) {
      try {
        this.inputValues[id] = JSON.parse(value);
      } catch (e) {
        this.inputValues[id] = value;
      }
    },
    submit() {
      if (!this.valid) {
        alert("Invalid Inputs");
        return false;
      }
      const minion = {};
      minion.name = "new minion";
      minion.target = this.target;
      minion.description = this.description;
      minion.id = this.minions.length + 1;
      minion.hexData =
        this.hexData ||
        this.web3.eth.abi.encodeFunctionCall(
          this.selectedFunction,
          this.inputValues
        );
      minion.abi = this.selectedFunction;
      minion.executed = false;
      this.$emit("submitted", minion);
    }
  }
};
</script>
