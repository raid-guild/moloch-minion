<template>
  <v-container>
    <p>Client: {{ escrow.clientName }}</p>
    <p>Sprint: {{ escrow.escrowName }}</p>
    <p>Description: {{ escrow.description }}</p>
    <p>Link to Deal: {{ escrow.escrowLink }}</p>
    <p>
      A deposit of {{ escrow.cap || "_______" }} in (token:
      {{ escrow.token || "_______" }}) will be held in this escrow
    </p>
    <p>bla bla bla</p>
  </v-container>
</template>
<script>
export default {
  props: { escrow: Object }
};
</script>
