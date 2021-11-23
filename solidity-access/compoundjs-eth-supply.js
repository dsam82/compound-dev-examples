const Compound = require('@compound-finance/compound-js')

const decimals = Compound.decimals[Compound.ETH]
const provider_url = process.env.PROVIDER_URL

const myAddress = process.env.MY_ADDRESS
const privateKey = process.env.PRIVATE_KEY

const myContractAddress = process.env.MY_CONTRACT_ADD;
const cethContractAddress = process.env.CETH_CONTRACT_ADD;

const main = async function() {
	const provider = new Compound._ethers.providers.JsonRpcProvider(provider_url)

	const contractIsDeployed = (await provider.getCode(myContractAddress)) !== '0x';

	if (!contractIsDeployed) {
		throw Error('MyContract is not deployed! Deploy it by running the deploy script.');
	}
	
	let tx = await mintCEth(Compound._ethers.utils.parseUnits('1', 'ethers'))
	let mintResult = await tx.wait(1)
	
	console.log("Supplied 1 ETH to Compound. ", mintResult)
	
	let cTokenBalance = balanceOf(Compound.cETH, myContractAddress)
	console.log("Contract balance after supply 1 eth. ", cTokenBalance)
	
	let balanceUnderlying = balanceOfUnderlying(Compound.cEth, myContractAddress)
	console.log("ETH supplied to Compound. ", balanceUnderlying)
	
	tx = await redeemCEth(cTokenBalance * 1e8)
	let redeemResult = await tx.wait(1)
	
	console.log(redeemResult.events)
	
	let cTokenBalance = balanceOf(Compound.cETH, myContractAddress)
	console.log("Contract balance after redeen 1 eth. ", cTokenBalance)
	
	let balance = await Compound.eth.getBalance(myContractAddress, provider_url)
	balance = +balance/1e18
	console.log("Contracts ETH balance ", balance)
}

main().catch((err) => {
	console.log(err)
})

const balanceOf = async function(token, address) {
	let balance;
	const cEthAddress = Compound.util.getAddress(token)
	try {
		balance = await Compound.eth.read(cEthAddress,
			'function balanceOf(address) public returns (uint)',
			[address],
			{
				provider: provider_url,
			});
		balance = +balance / Compound.decimals[token]
	} catch(e) {
		console.error(e)
	}
	
	return balance
}

const balanceOfUnderlying = async function(token, address) {
	let balanceOfUnderlying;
	const CEthAddress = Compound.util.getAddress(token)
	try {
		balanceOfUnderlying = await Compound.eth.read(CEthAddress,
			'function balanceOfUnderlying(address) public returns (uint)',
			[address],
			{
				provider: provider_url,
			});
		balanceOfUnderlying = +balanceOfUnderlying/1e18
	} catch (e) {
		console.error(e)
	}
	
	return balanceOfUnderlying
}

const mintCEth = async function(ethAmount) {
	let tx;
	try {
		tx = await Compound.eth.trx(myContractAddress,
			'function mintCEth(address) public payable returns (bool)',
			[cethContractAddress],
			{
				provider: provider_url,
				privateKey,
				value: ethAmount,
			}
		);
	} catch (e) {
		console.error(e)
	}
	
	return tx;
}

const redeemCEth = async function(cToken) {
	let tx;
	try {
		tx = await Compound.eth.trx(myContractAddress,
			'function redeemCEth(uint, bool, address) public returns (bool)',
			[cToken, true, cethContractAddress], 
			{
				provider: provider_url,
				privateKey,
			});
	} catch(e) {
		console.error(e)
	}
	
	return tx;
}
