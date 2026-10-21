// Where to go after signing in: back to the page that asked for it, else the account's home.
export function destinationFor(account, from) {
  if (from) return from
  return account.accountType === 'seller' ? '/seller/dashboard' : '/marketplace'
}
