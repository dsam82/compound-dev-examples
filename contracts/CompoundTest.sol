//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";


interface ERC20 {
	function approve(address, uint256) external returns (bool);
	function transfer(address, uint256) external returns (bool);
}

interface CErc20 {
	function mint(uint256) external returns (uint256);
	function redeem(uint) external returns (uint);
	
	function exchangeRateCurrent() external returns (uint256);
	function redeemUnderlying(uint) external returns (uint);
}

interface CEth {
	function mint() external payable;
	function redeem(uint) external returns (uint256);
	
	function exchangeRateCurrent() external returns (uint256);
	function balanceOfUnderlying(address owner) external view returns (uint256 balance);
	function redeemUnderlying(uint) external returns (uint256);
}

contract CompoundTest {
	event contractLogs(string, uint);

	function mintCEth(address payable _contract_add) public payable returns (bool) {
		CEth ceth = CEth(_contract_add);
		
		uint256 exchangeRate = ceth.exchangeRateCurrent();
		console.log("Current Exchange Rate: %s", exchangeRate);
		emit contractLogs("Current Exchange Rate: %s", exchangeRate);

		ceth.mint{value: msg.value, gas: 250000 }();
		return true;
	}
	
	function redeemCEth(uint tokens, bool redeemType, address _contract_add) public returns (bool) {
		CEth ceth = CEth(_contract_add);
		
		uint256 bal = ceth.balanceOfUnderlying(msg.sender);
		console.log("BalanceOfUnderlying: %s", bal);

		uint256 result;
		
		if (redeemType) {
			result = ceth.redeem(tokens);
		} else {
			result = ceth.redeemUnderlying(tokens);
		}
		
		console.log("redeem result: %s", result);
		emit contractLogs("redeem result: %s", result);

		return true;
	}
	
	function mintCErc20(address _erc20Contract, address _cErc20Contract, uint256 _numTokensToSupply) public returns (uint) {
		ERC20 erc20 = ERC20(_erc20Contract);
		CErc20 cToken = CErc20(_cErc20Contract);
		
		erc20.approve(_cErc20Contract, _numTokensToSupply);
		return cToken.mint(_numTokensToSupply);
	}

	function redeemCErc20(address _cErc20Contract, uint256 amount, bool redeemType) public returns (bool) {
		CErc20 cToken = CErc20(_cErc20Contract);
		
		uint256 redeemResult;
		if (redeemType) {
			redeemResult = cToken.redeem(amount);
		} else {
			redeemResult = cToken.redeemUnderlying(amount);
		}
		
		emit contractLogs("amount ETH redeemed: ", redeemResult);
		
		return true;
	}

	receive() external payable {}
}