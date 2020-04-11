<template>
  <v-col>
    <v-card max-width="400" class="mx-auto">
      <v-container>
        <v-row dense>
          <v-col cols="12">
            <v-card color="#385F73" dark>
              <v-card-title class="headline">{{ minion.name }}</v-card-title>

              <v-card-subtitle>{{ minion.description }}</v-card-subtitle>

              <v-card-actions>
                <v-btn text>Execute</v-btn>
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
    minion: Object
  }
};
</script>
