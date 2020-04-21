import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import vuetify from "./plugins/vuetify";
import VueApollo from "vue-apollo";
import ApolloClient from "apollo-boost";

Vue.use(VueApollo);
Vue.config.productionTip = false;

const graphURI = {
  kovan:
    "https://api.thegraph.com/subgraphs/name/odyssy-automaton/daohaus-kovan",
  mainnet: "https://api.thegraph.com/subgraphs/name/odyssy-automaton/daohaus"
};

const apolloClient = new ApolloClient({
  // You should use an absolute URL here
  uri: process.env.VUE_APP_CHAIN === "kovan" ? graphURI.kovan : graphURI.mainnet
});

const apolloProvider = new VueApollo({
  defaultClient: apolloClient
});

new Vue({
  router,
  vuetify,
  apolloProvider,
  render: h => h(App)
}).$mount("#app");
