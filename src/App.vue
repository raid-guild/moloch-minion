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
        :minions="minions"
      >
      </router-view>
    </v-content>

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

export default {
  props: {
    source: String
  },
  apollo: {
    proposals: gql`
      query {
        proposals(
          where: { molochAddress: "0x501f352e32ec0c981268dc5b5ba1d3661b1acbc6" }
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
    proposals: [],
    overlay: false,
    contractAddr: process.env.VUE_APP_CONTRACT_ADDR
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
    },
    events: function() {
      // TODO: resolve into minion for executed property
      // const contract = new this.web3.eth.Contract(abi, this.contractAddr);
      // return await contract.getPastEvents(
      //   "ActionExecuted",
      //   {
      //     fromBlock: 0,
      //     toBlock: "latest",
      //   },
      //   (err, ev) => {
      //     return ev;
      //   }
      // );
      return [];
    }
  },
  components: { Web3Signin },
  methods: {
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
        // TODO: check valid chain id
        const [account] = await this.web3.eth.getAccounts();
        this.user = account;
      } catch (err) {
        console.log("web3Modal error", err);
      }
    },
    async onSubmittedChild(minion) {
      this.overlay = true;
      const contract = new this.web3.eth.Contract(abi, this.contractAddr);
      try {
        const txReceipt = await contract.methods
          .proposeAction(minion.target, 0, minion.hexData, minion.description)
          .send({ from: this.user });
        console.log("txReceipt", txReceipt); // TODO: provide link to etherscan while loading
        // minion.proposalId =
        // timeout to let things sync?
        setTimeout(() => {
          this.overlay = false;
          this.$router.push("/");
        }, 1000);
      } catch (e) {
        this.overlay = false;
        console.log("rejected", e);
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
        console.log("txReceipt", txReceipt); // TODO: provide link to etherscan while loading
        // timeout to let things sync?
        setTimeout(() => {
          this.overlay = false;
          this.proposals.find(
            minion => minion.proposalId === id
          ).executed = true;
        }, 1000);
      } catch (e) {
        this.overlay = false;
        console.log("rejected", e);
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
