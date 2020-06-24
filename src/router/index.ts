import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import About from "../views/About.vue";
import NewMinion from "../views/NewMinion.vue";
import Ens from "../views/Ens.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home
  },
  {
    path: "/about",
    name: "About",
    component: About
  },
  {
    path: "/new",
    name: "New Minion",
    component: NewMinion
  },
  {
    path: "/ens",
    name: "ENS",
    component: Ens
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
