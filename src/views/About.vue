<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="5">
        <v-img
          :src="require('../assets/smiling-face-with-horns.png')"
          contain
          height="200"
        ></v-img>
      </v-col>
    </v-row>
    <v-row align="center" justify="center">
      <v-col cols="5">
        <h1>About</h1>
        <p>
          There was no way built into Moloch V2 to run arbitrary functions from
          different contracts through a passing proposal. This now works through
          a 'Minion' contract, through a funding proposal in V2 with 0 shares.
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>
