import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import About from "../views/About.vue";
import NewMinion from "../views/NewMinion.vue";
import Ens from "../views/Ens.vue";
import Nft from "../views/Nft.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/about/:minion?",
    name: "About",
    component: About
  },
  {
    path: "/new/:minion?",
    name: "New Minion",
    component: NewMinion
  },
  {
    path: "/ens/:minion?",
    name: "ENS",
    component: Ens
  },
  {
    path: "/nft/:minion?",
    name: "NFT",
    component: Nft
  },
  {
    path: "/:minion?",
    name: "Home",
    component: Home
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
