const { getChains } = require("@lifi/sdk");

getChains({ chainTypes: ["EVM"] })
  .then((result) => {
    const matches = result.chains.filter(
      (chain) =>
        chain.id === 46630 ||
        /arc/i.test(chain.name)
    );

    console.log(JSON.stringify(matches, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
