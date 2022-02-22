beforeAll(async function () {
  // NOTE: nearlib and nearConfig are made available by near-cli/test_environment
  const near = await nearlib.connect(nearConfig)
  window.accountId = nearConfig.contractName
  window.contract = await near.loadContract(nearConfig.contractName, {
    viewMethods: ['get_greeting', 'get_downvotes'],
    changeMethods: ['set_greeting', 'increment_downvotes'],
    sender: window.accountId
  })

  window.walletConnection = {
    requestSignIn() {
    },
    signOut() {
    },
    isSignedIn() {
      return true
    },
    getAccountId() {
      return window.accountId
    }
  }
})

test('get_greeting', async () => {
  const message = await window.contract.get_greeting({ account_id: window.accountId })
  expect(message).toEqual('Hello')
})

test('get_downvotes', async () => {
  const downvotes = await window.contract.get_downvotes()
  expect(downvotes).toEqual(0)
})

test('increment_downvotes', async () => {
  await window.contract.increment_downvotes()
  const downvotes = await window.contract.get_downvotes()
  expect(downvotes).toEqual(1)
})
