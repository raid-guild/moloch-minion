<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <h2>ESCROW Detail</h2>
    </v-row>
    <v-row align="center" justify="center">
      <h2>{{ selectedEscrow[0].clientName }}</h2>
    </v-row>
    <v-row align="center" justify="center">
      <h2>{{ selectedEscrow[0].escrowName }}</h2>
    </v-row>
    <v-row align="center" justify="center">
      <v-btn color="primary" class="mr-4" @click="deposit">
        Deposit
      </v-btn>
    </v-row>
  </v-container>
</template>
<script>
export default {
  props: {
    escrowList: Array
  },
  computed: {
    selectedEscrow: function() {
      return this.escrowList.filter(
        escrow =>
          this.$route.params.id.toLowerCase() ===
          escrow.clientName.toLowerCase()
      );
    }
  },
  methods: {
    deposit() {
      console.log("deposited");
    }
  }
};
</script>
