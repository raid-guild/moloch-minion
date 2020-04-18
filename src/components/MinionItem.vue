<template>
  <v-col>
    <v-card max-width="400" class="mx-auto">
      <v-container>
        <v-row dense>
          <v-col cols="12">
            <v-card color="#385F73" dark>
              <v-card-title class="headline"
                >Minion: {{ minion.proposalId }}</v-card-title
              >

              <v-card-subtitle>{{ minion.description }}</v-card-subtitle>
              <v-card-text>
                <span v-if="isExecuted()">executed</span>
              </v-card-text>
              <v-card-actions>
                <v-btn
                  v-if="!isExecuted() && minion.didPass"
                  text
                  @click="executeItem"
                  >Execute</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-col>
</template>

<script>
export default {
  props: {
    minion: Object,
    events: Array,
    execute: Function
  },
  methods: {
    executeItem() {
      this.execute(this.minion.proposalId);
    },
    isExecuted() {
      return this.events.some(
        item => item.returnValues.proposalId === this.minion.proposalId
      );
    }
  }
};
</script>
