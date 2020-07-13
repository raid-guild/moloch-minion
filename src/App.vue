<template>
  <v-app id="inspire">
    <v-navigation-drawer v-model="drawer" app clipped>
      <v-list dense>
        <v-subheader>Minion Navigation</v-subheader>
        <v-list-item link @click="$router.push(`/${minionAddr}`)">
          <v-list-item-action>
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Current Proposals</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link @click="$router.push(`/new/${minionAddr}`)">
          <v-list-item-action>
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Submit New Proposals</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link @click="$router.push(`/about/${minionAddr}`)">
          <v-list-item-action>
            <v-icon>mdi-settings</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>About</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider class="mx-4" :inset="inset" vertical></v-divider>
        <v-subheader>Forged Tools</v-subheader>
        <v-list-item link @click="$router.push(`/ens/${minionAddr}`)">
          <v-list-item-action>
            <v-icon>mdi-settings</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>ENS</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app clipped-left>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title>Minion</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="user" small color="primary" dark>{{ user }}</v-btn>
      <Web3Signin v-if="!user" :signIn="signIn" />
    </v-app-bar>

    <v-content>
      <router-view
        @submitted="onSubmittedChild"
        @registered="onRegisteredChild"
        @executed="onExecutedChild"
        @actionDetails="onGetMinionDetails"
        :minions="minions"
        :domains="domains"
        :subdomains="subdomains"
        :events="events"
        :web3="web3"
      ></router-view>
    </v-content>

    <v-row justify="center">
      <v-dialog v-model="dialog" persistent max-width="500">
        <v-card>
          <v-card-title class="headline">Minion Details</v-card-title>
          <v-card-text>proposer: {{ details.proposer }}</v-card-text>
          <v-card-text>target: {{ details.to }}</v-card-text>
          <v-card-text v-if="details.method">
            method: {{ details.method }}
          </v-card-text>
          <v-card-text v-if="details.params && details.params.length">
            params:
          </v-card-text>
          <v-card-text
            v-for="(item, index) in details.params"
            v-bind:key="index"
            style="padding-left: 40px;"
          >
            {{ item.name }}: {{ item.value }}
          </v-card-text>
          <v-card-text>data: {{ details.data }}</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" text @click="dialog = false"
              >Close</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>

    <v-footer app>
      <span>&copy; 2020</span>
      <v-spacer></v-spacer>
      <span>Minion {{ minionAddr.substring(0, 6) }}... </span>
      <v-spacer></v-spacer>
      <span>Moloch {{ molochAddr.substring(0, 6) }}... </span>
    </v-footer>
    <v-overlay :value="overlay">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
  </v-app>
</template>
<script>
import Web3Signin from "./components/Web3Signin";
import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import abiDecoder from "abi-decoder";
import gql from "graphql-tag";
import minionAbi from "./abi/minion.json";
import molochAbi from "./abi/moloch_v2.json";
import subdomainRegistrarAbi from "./abi/minion_subdomain_registrar.json";

// dao address is gotten from minion contract
const addresses = {
  minion: {
    kovan: "0x98B550E95E90ADFA6D9841fAB937D81FcFEab6D2",
    mainnet: "0x17405148473E521b62cBCf8eBd929E8A30C4D3aA"
  },
  dao: {
    kovan: "0x501f352e32ec0c981268dc5b5ba1d3661b1acbc6",
    mainnet: "0xbeb3e32355a933501c247e2dbde6e6ca2489bf3d"
  },
  subdomainRegistrar: {
    kovan: "0x0f00B15630AAa854A6021437131c12ff2B25fa6f",
    mainnet: "0x5Cb634C351A03FF2BfB59C73dB8B429FFdFBbB62"
  },
  resolver: {
    kovan: "0xbe3f1473231C9DbC62603F4964406f9D3c4E40f2",
    mainnet: "0xDaaF96c344f63131acadD0Ea35170E7892d3dfBA"
  }
};

const abis = [
  minionAbi,
  require("./abi/certnft.json"),
  require("./abi/ctoken.json"),
  require("./abi/erc20.json"),
  require("./abi/erc721.json"),
  require("./abi/moloch_v1.json"),
  require("./abi/moloch_v1_pool.json"),
  require("./abi/moloch_v2.json"),
  require("./abi/moloch_v2_guildbank.json"),
  require("./abi/uniswap_v2_router.json")
];

abis.map(abi => abiDecoder.addABI(abi));

export default {
  props: {
    source: String
  },
  apollo: {
    proposals: {
      query: gql`
        query($addr: String) {
          proposals(where: { molochAddress: $addr }) {
            molochAddress
            proposalIndex
            proposalId
            didPass
            details
          }
        }
      `,
      variables() {
        return {
          addr: this.molochAddr
        };
      }
    }
  },
  data: () => ({
    drawer: null,
    user: null,
    web3: null,
    dialog: false,
    proposals: [],
    overlay: false,
    domains: [],
    subdomains: [],
    events: [],
    details: {},
    minionAddr:
      process.env.VUE_APP_CHAIN === "kovan"
        ? addresses.minion.kovan
        : addresses.minion.mainnet,
    molochAddr:
      process.env.VUE_APP_CHAIN === "kovan"
        ? addresses.dao.kovan
        : addresses.dao.mainnet,
    subdomainRegistrarAddr:
      process.env.VUE_APP_CHAIN === "kovan"
        ? addresses.subdomainRegistrar.kovan
        : addresses.subdomainRegistrar.mainnet,
    resolverAddr:
      process.env.VUE_APP_CHAIN === "kovan"
        ? addresses.resolver.kovan
        : addresses.resolver.mainnet
  }),
  computed: {
    minions: function() {
      const data = this.proposals
        .filter(item => {
          let isMinion = false;
          try {
            isMinion = JSON.parse(item.details).isMinion;
          } catch (e) {
            ("pass");
          }
          return isMinion;
        })
        .map(item => {
          try {
            item.description = JSON.parse(item.details).description;
          } catch (e) {
            item.description = "description";
          }
          return item;
        });
      return data;
    }
  },
  components: { Web3Signin },
  methods: {
    async getEventLog() {
      const contract = new this.web3.eth.Contract(minionAbi, this.minionAddr);
      const events = await contract.getPastEvents(
        "ActionExecuted",
        {
          fromBlock: 0,
          toBlock: "latest"
        },
        (err, ev) => {
          return ev;
        }
      );
      this.events = events;
    },
    async getDomains() {
      const contract = new this.web3.eth.Contract(
        subdomainRegistrarAbi,
        this.subdomainRegistrarAddr
      );
      const [configureEvents, unlistEvents] = await Promise.all([
        contract.getPastEvents(
          "DomainConfigured",
          {
            filter: {
              minion: this.minionAddr
            },
            fromBlock: 0,
            toBlock: "latest"
          },
          (err, ev) => {
            return ev;
          }
        ),
        contract.getPastEvents(
          "DomainUnlisted",
          {
            filter: {},
            fromBlock: 0,
            toBlock: "latest"
          },
          (err, ev) => {
            return ev;
          }
        )
      ]);
      const unlisted = unlistEvents.map(ev => ev.returnValues.label);
      this.domains = configureEvents
        .map(ev => ev.returnValues)
        .filter(d => !unlisted.includes(d.label));
      this.getSubDomains();
    },
    async getSubDomains() {
      const contract = new this.web3.eth.Contract(
        subdomainRegistrarAbi,
        this.subdomainRegistrarAddr
      );
      const events = await contract.getPastEvents(
        "NewRegistration",
        {
          filter: {
            label: this.domains.map(d => d.label)
          },
          fromBlock: 0,
          toBlock: "latest"
        },
        (err, ev) => {
          return ev;
        }
      );
      this.subdomains = events.map(ev => ev.returnValues);
    },
    async onGetMinionDetails(id) {
      this.dialog = true;
      const contract = new this.web3.eth.Contract(minionAbi, this.minionAddr);
      this.details = await contract.methods.actions(id).call();
      const decode = abiDecoder.decodeMethod(this.details.data);
      this.details.method = decode && decode.name ? decode.name : null;
      this.details.params = decode && decode.params ? decode.params : [];
    },
    async signIn() {
      try {
        const providerOptions = {
          walletconnect: {
            package: WalletConnectProvider, // required
            options: {
              infuraId: process.env.VUE_APP_INFURA
            }
          }
        };
        const web3Modal = new Web3Modal({
          providerOptions, // required
          cacheProvider: true
        });

        const provider = await web3Modal.connect();

        this.web3 = new Web3(provider);
        this.getEventLog();
        this.getDomains();
        // TODO: check valid chain id
        const [account] = await this.web3.eth.getAccounts();
        this.user = account;
      } catch (err) {
        // console.log("web3Modal error", err);
      }
    },
    async getMoloch(minionAddr) {
      const contract = new this.web3.eth.Contract(minionAbi, minionAddr);
      try {
        const moloch = await contract.methods.moloch().call();
        return moloch;
      } catch (err) {
        //TODO: use modal instead of alert
        alert(
          "invalid minion address, will reload with default. Make sure you are on the correct network."
        );
        window.location.href = "/";
      }
    },
    async onSubmittedChild(minion) {
      // force user to sign in before submitting new proposal
      if (!this.user) {
        return this.signIn();
      }

      this.overlay = true;
      const contract = new this.web3.eth.Contract(minionAbi, this.minionAddr);
      try {
        const txReceipt = await contract.methods
          .proposeAction(minion.target, 0, minion.hexData, minion.description)
          .send({ from: this.user });
        // TODO: provide link to etherscan while loading
        this.$apollo.queries.proposals.refetch();

        // timeout to let things sync?
        setTimeout(() => {
          this.overlay = false;
          this.$router.push("/");
        }, 1000);
      } catch (e) {
        this.overlay = false;
        // console.log("rejected", e);
      }
    },
    async onRegisteredChild(request) {
      const molochContract = new this.web3.eth.Contract(
        molochAbi,
        this.molochAddr
      );
      const member = await molochContract.methods.members(request.owner).call();
      // If subdomain owner is not a member, decision is handled by Minion via Moloch vote
      if (member.shares > 0) {
        // force user to sign in before submitting new proposal
        if (!this.user) {
          return this.signIn();
        }
        this.overlay = true;

        const contract = new this.web3.eth.Contract(
          subdomainRegistrarAbi,
          this.subdomainRegistrarAddr
        );
        try {
          const txReceipt = await contract.methods
            .register(
              this.web3.utils.sha3(request.domain),
              request.subdomain,
              request.owner,
              this.resolverAddr
            )
            .send({ from: this.user });

          // timeout to let things sync?
          setTimeout(() => {
            this.overlay = false;
            this.$router.push("/");
          }, 1000);
        } catch (e) {
          this.overlay = false;
          // console.log("rejected", e);
        }
      } else {
        const minion = {};
        minion.target = this.subdomainRegistrarAddr;
        minion.description = `Assign subdomain ${request.subdomain}.${request.domain}.eth to ${request.owner} (requested by ${this.user}).`;
        minion.id = this.minions.length + 1;
        const registerFunc = subdomainRegistrarAbi.find(
          func => func.name && func.name === "register"
        );
        minion.hexData = this.web3.eth.abi.encodeFunctionCall(registerFunc, [
          this.web3.utils.sha3(request.domain),
          request.subdomain,
          request.owner,
          this.resolverAddr
        ]);
        this.onSubmittedChild(minion);
      }
    },
    async onExecutedChild(id) {
      // force user to sign in before executing proposal
      if (!this.user) {
        return this.signIn();
      }

      this.overlay = true;
      // make web3 call
      const contract = new this.web3.eth.Contract(minionAbi, this.minionAddr);
      try {
        const txReceipt = await contract.methods
          .executeAction(id)
          .send({ from: this.user });
        // TODO: provide link to etherscan while loading
        // timeout to let things sync?
        setTimeout(() => {
          this.overlay = false;
          this.proposals.find(
            minion => minion.proposalId === id
          ).executed = true;
        }, 1000);
      } catch (e) {
        this.overlay = false;
        // console.log("rejected", e);
      }
    }
  },
  async created() {
    // get minion address from route if availible
    if (
      this.$route.params.minion &&
      /^(0x){1}[0-9a-fA-F]{40}$/i.test(this.$route.params.minion)
    ) {
      this.minionAddr = this.$route.params.minion;
    } else {
      this.$router.push(`/${this.minionAddr}`);
    }
    this.$vuetify.theme.dark = true;
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: process.env.VUE_APP_INFURA
        }
      }
    };
    const web3Modal = new Web3Modal({
      providerOptions, // required
      cacheProvider: true
    });
    if (web3Modal.cachedProvider) {
      await this.signIn();
      this.molochAddr = await this.getMoloch(this.minionAddr);
    }
  }
};
</script>
