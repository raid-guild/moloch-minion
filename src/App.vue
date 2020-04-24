<template>
  <v-app id="inspire">
    <v-navigation-drawer v-model="drawer" app clipped>
      <v-list dense>
        <v-list-item link>
          <v-list-item-action>
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title @click="$router.push('/')"
              >Current Proposals</v-list-item-title
            >
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-action>
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title @click="$router.push('/new')"
              >Submit New Proposals</v-list-item-title
            >
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-action>
            <v-icon>mdi-settings</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title @click="$router.push('about')"
              >About</v-list-item-title
            >
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
        @executed="onExecutedChild"
        @actionDetails="onGetMinionDetails"
        :minions="minions"
        :events="events"
      >
      </router-view>
    </v-content>

    <v-row justify="center">
      <v-dialog v-model="dialog" persistent max-width="500">
        <v-card>
          <v-card-title class="headline">Minion Details</v-card-title>
          <v-card-text>proposer: {{ details.proposer }}</v-card-text>
          <v-card-text>target: {{ details.to }}</v-card-text>
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
      <span>&copy; 2019</span>
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
import gql from "graphql-tag";
import abi from "./abi/minion.json";

const addresses = {
  minion: {
    kovan: "0x98B550E95E90ADFA6D9841fAB937D81FcFEab6D2",
    mainnet: "0x17405148473E521b62cBCf8eBd929E8A30C4D3aA"
  },
  dao: {
    kovan: "0x501f352e32ec0c981268dc5b5ba1d3661b1acbc6",
    mainnet: "0xbeb3e32355a933501c247e2dbde6e6ca2489bf3d"
  }
};

export default {
  props: {
    source: String
  },
  apollo: {
    proposals: gql`
      query {
        proposals(
          where: { molochAddress: "${
            process.env.VUE_APP_CHAIN === "kovan"
              ? addresses.dao.kovan
              : addresses.dao.mainnet
          }" }
        ) {
          molochAddress
          proposalIndex
          proposalId
          didPass
          details
        }
      }
    `
  },
  data: () => ({
    drawer: null,
    user: null,
    web3: null,
    dialog: false,
    proposals: [],
    overlay: false,
    events: [],
    details: {},
    contractAddr:
      process.env.VUE_APP_CHAIN === "kovan"
        ? addresses.minion.kovan
        : addresses.minion.mainnet
  }),
  computed: {
    minions: function() {
      const data = this.proposals
        .filter(item => {
          let isMinion = false; // TODO: set false and reasign after testing
          try {
            isMinion = JSON.parse(item.details).isMinion;
          } catch (e) {
            ("pass");
          }
          return isMinion;
        }) // TODO: check if is minion
        .map(item => {
          try {
            item.description = JSON.parse(item.details).description;
          } catch (e) {
            item.description = "description";
          }
          // TODO: get is item.executed from minion contract public actions struct or ActionExecuted event
          return item;
        });
      return data;
    }
  },
  components: { Web3Signin },
  methods: {
    async getEventLog() {
      const contract = new this.web3.eth.Contract(abi, this.contractAddr);
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
      //console.log('events', events)
    },
    async onGetMinionDetails(id) {
      this.dialog = true;
      const contract = new this.web3.eth.Contract(abi, this.contractAddr);
      this.details = await contract.methods.actions(id).call();
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
        // TODO: check valid chain id
        const [account] = await this.web3.eth.getAccounts();
        this.user = account;
      } catch (err) {
        // console.log("web3Modal error", err);
      }
    },
    async onSubmittedChild(minion) {
      this.overlay = true;
      const contract = new this.web3.eth.Contract(abi, this.contractAddr);
      try {
        const txReceipt = await contract.methods
          .proposeAction(minion.target, 0, minion.hexData, minion.description)
          .send({ from: this.user });
        // console.log("txReceipt", txReceipt); // TODO: provide link to etherscan while loading
        // minion.proposalId =
        // timeout to let things sync?
        setTimeout(() => {
          this.overlay = false;
          this.$router.push("/");
        }, 1000);
      } catch (e) {
        this.overlay = false;
        // console.log("rejected", e);
      }
      // should not be needed if graph syncs
      // this.proposals.push(minion);
    },
    async onExecutedChild(id) {
      this.overlay = true;
      //TODO: make web3 call
      const contract = new this.web3.eth.Contract(abi, this.contractAddr);
      try {
        const txReceipt = await contract.methods
          .executeAction(id)
          .send({ from: this.user });
        // console.log("txReceipt", txReceipt); // TODO: provide link to etherscan while loading
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
  created() {
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
      this.signIn();
    }
  }
};
</script>
