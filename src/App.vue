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

export default {
  props: {
    source: String
  },
  data: () => ({
    drawer: null,
    user: null,
    web3: null,
    minions: [
      { id: 1, name: "minion 1", desc: "", executed: false },
      { id: 2, name: "minion 2", desc: "", executed: false }
    ],
    overlay: false
  }),
  components: { Web3Signin },
  methods: {
    async signIn() {
      try {
        const providerOptions = {
          walletconnect: {
            package: WalletConnectProvider, // required
            options: {
              infuraId: "895440c3ef614d1e835c6b2f114067e8"
            }
          }
        };
        const web3Modal = new Web3Modal({
          providerOptions, // required
          cacheProvider: true
        });

        const provider = await web3Modal.connect();

        this.web3 = new Web3(provider);
        const [account] = await this.web3.eth.getAccounts();
        this.user = account;
      } catch (err) {
        console.log("web3Modal error", err);
      }
    },
    onSubmittedChild(minion) {
      this.overlay = true;
      setTimeout(() => {
        this.overlay = false;
        this.$router.push("/");
      }, 3000);
      //TODO: make web3 call
      this.minions.push(minion);
    },
    onExecutedChild(id) {
      this.overlay = true;
      //TODO: make web3 call
      setTimeout(() => {
        this.overlay = false;
        this.minions.find(minion => minion.id === id).executed = true;
      }, 3000);
    }
  },
  created() {
    this.$vuetify.theme.dark = true;
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: "895440c3ef614d1e835c6b2f114067e8"
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
