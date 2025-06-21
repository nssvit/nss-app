<template>
  <div>
    <VitePwaManifest />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <PwaPrompt />
      <PwaDebug />
    </ClientOnly>
  </div>
</template>
