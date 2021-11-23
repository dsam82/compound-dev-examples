const Compound = require("@compound-finance/compound-js")

const privateKey = process.env.PRIVATE_KEY
const provider_url = process.env.PROVIDER_URL

const myContractAddress = process.env.MY_CONTRACT_ADD;

const TokenName = Compound.DAI
const cTokenName = Compound.cDai

const assetAddress = Compound.util.getAddress(TokenName);
const assetDecimal = await Compound.decimals[TokenName];

const cAssetAddress = Compound.util.getAddress(cTokenName);

const compound = new Compound(provider_url, {privateKey});

const main = async function() {
	const provider = new Compound._ethers.providers.JsonRpcProvider(provider_url)
	
	const contractIsDeployed = (await provider.getCode(myContractAddress)) !== '0x';

	if (!contractIsDeployed) {
		throw Error('MyContract is not deployed! Deploy it by running the deploy script.');
	}
	
	let amount = (10*Math.pow(10, int(assetDecimal))).toString()
	let tx = await erc20Transfer(myContractAddress, amount)
	await tx.wait(1);
	
	console.log(`${amount} transferred from ${TokenName} to myContract`);
	
	tx = await mintCErc20Tokens(amount)
	let mintResult = await tx.wait(1);
	
	console.log(mintResult.events);
	console.log(`cToken ${TokenName} minted`)
	
	let balanceOf = await _balanceOf(cTokenName, myContractAddress)
	console.log(`${cTokenName}'s balance in contract: ${balanceOf}`)
	
	let balanceOfUnderlying = await _balanceOfUnderlying(myContractAddress)
	console.log(`${TokenName} supplied to Contract. ${balanceOfUnderlying}`)
	
	tx = await redeemCErc20Token(balanceOf, true, myContractAddress)
	let redeemResult = await tx.wait(1)
	
	console.log(redeemResult.events)
	
	let balanceOf = await _balanceOf(cTokenName, myContractAddress)
	console.log(`${cTokenName}'s balance in contract: ${balanceOf}`)
}

main().catch((err) => {
	if (err) {
		console.log(err)
	}
})

const erc20Transfer = async function(address, amount) {
	let tx;
	try {
		tx = await Compound.eth.trx(assetAddress, 
			'function transfer(address, uint256) public returns (bool)'
			[address, amount],
			{
				provider: provider_url,
				privateKey,
			}
		);
	} catch (e) {
		console.error(e)
	}
	
	return tx;
}

const mintCErc20Tokens = async function(amount) {
	let tx;
	try {
		tx = await Compound.eth.trx(myContractAddress, 
			'function mintCErc20(address, address, uint256) public returns (uint)',
			[assetAddress, cAssetAddress, amount],
			{
				provider: provider_url,
				privateKey,
			});
	} catch (e) {
		console.error(e)
	}
	
	return tx;
}

const redeemCErc20Token = async function(amount, redeemType, address) {
	let tx;
	try {
		tx = await Compound.eth.trx(myContractAddress, 
			'function redeemCErc20(address, uint256, bool) public returns (bool)'
			[address, amount, redeemType],
			{
				provider: provider_url,
				privateKey
			}
		);
	} catch (e) {
		console.error(e)
	}
	
	return tx;
}

const _balanceOf = async function(token, address) {
	let balance;
	try {
		balance = await Compound.eth.read(assetAddress,
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

const _balanceOfUnderlying = async function(address) {
	let balanceOfUnderlying;
	try {
		balanceOfUnderlying = await Compound.eth.read(cAssetAddress,
			'function balanceOfUnderlying(address) public returns (uint)',
			[address],
			{
				provider: provider_url,
			});
		balanceOfUnderlying = +balanceOfUnderlying/assetDecimal
	} catch (e) {
		console.error(e)
	}
	
	return balanceOfUnderlying
}