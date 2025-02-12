# keploy-github-app-beta

> A GitHub App built with [Probot](https://github.com/probot/probot) that Keploy app beta version

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t keploy-github-app-beta .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> keploy-github-app-beta
```

## Contributing

If you have suggestions for how keploy-github-app-beta could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2025 Sky Singh
