<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <h2>ESCROW Detail</h2>
    </v-row>
    <v-row align="center" justify="center">
      <EscrowPreview :escrow="selectedEscrow[0]" />
    </v-row>

    <v-row align="center" justify="center">
      <v-btn color="primary" class="mr-4" @click="deposit">
        Deposit
      </v-btn>
    </v-row>
    <v-row align="center" justify="center">
      <v-btn @click="dialog1 = true" color="accent" class="mr-4">
        Lock
      </v-btn>
      <v-btn @click="dialog2 = true" color="primary" class="mr-4">
        Release
      </v-btn>
    </v-row>
    <v-dialog v-model="dialog1" persistent max-width="290">
      <v-card>
        <v-card-title class="headline"
          >Are you sure you want to lock this?</v-card-title
        >
        <v-card-text
          >This will lock the escrow for arbitration and can not be
          undone</v-card-text
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="dialog1 = false"
            >Disagree</v-btn
          >
          <v-btn color="green darken-1" text @click="lock">Agree</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialog2" persistent max-width="290">
      <v-card>
        <v-card-title class="headline"
          >Are you sure you want to Release this?</v-card-title
        >
        <v-card-text>This will release this milestones funds</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="dialog2 = false"
            >Disagree</v-btn
          >
          <v-btn color="green darken-1" text @click="release">Agree</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script>
import EscrowPreview from "../components/EscrowPreview";

export default {
  props: {
    escrowList: Array
  },
  data() {
    return {
      dialog: false,
      dialog1: false,
      dialog2: false
    };
  },
  components: { EscrowPreview },

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
    },
    lock() {
      console.log("locked");
      this.dialog1 = false;
    },
    release() {
      console.log("release");
      this.dialog2 = false;
    }
  }
};
</script>
