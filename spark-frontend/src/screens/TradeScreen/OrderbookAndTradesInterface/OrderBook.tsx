import styled from "@emotion/styled";
import React, { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import SizedBox from "@components/SizedBox";
import { useTradeScreenVM } from "@screens/TradeScreen/TradeScreenVm";
import BN from "@src/utils/BN";
import { useStores } from "@stores";
import Skeleton from "react-loading-skeleton";
import { Column, Row } from "@src/components/Flex";
import Text, { TEXT_TYPES } from "@components/Text";
import { useTheme } from "@emotion/react";
import useEventListener from "@src/utils/useEventListener";
import hexToRgba from "@src/utils/hexToRgb";

interface IProps extends HTMLAttributes<HTMLDivElement> {
	mobileMode?: boolean;
}

const Root = styled(Column)`
	grid-area: orderbook;
	width: 100%;
`;
const OrderBookHeader = styled.div<{}>`
	width: 100%;
	box-sizing: border-box;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	padding: 0 12px;
	text-align: center;

	& > * {
		text-align: start;
	}

	& > :last-of-type {
		text-align: end;
	}
`;
const OrderRow = styled(Row)<{
	type: "buy" | "sell";
	fulfillPercent?: number;
	volumePercent?: number;
}>`
	position: relative;
	cursor: pointer;
	margin-bottom: 1px;
	height: 16px;
	width: 100%;
	justify-content: space-between;
	align-items: center;
	padding: 0 12px;
	box-sizing: border-box;
	background: transparent;
	transition: 0.4s;

	&:hover {
		background: ${({ type, theme }) =>
			type === "buy" ? hexToRgba(theme.colors.greenLight, 0.1) : hexToRgba(theme.colors.redLight, 0.1)};
	}

	.progress-bar {
		z-index: 0;
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background: ${({ type, theme }) =>
			type === "buy" ? hexToRgba(theme.colors.greenLight, 0.1) : hexToRgba(theme.colors.redLight, 0.1)};
		transition: all 0.3s;
		width: ${({ fulfillPercent }) => (fulfillPercent != null ? `${fulfillPercent}%` : `0%`)};
	}

	.volume-bar {
		z-index: 0;
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background: ${({ type, theme }) =>
			type === "buy" ? hexToRgba(theme.colors.greenLight, 0.3) : hexToRgba(theme.colors.redLight, 0.3)};
		transition: all 0.3s;
		width: ${({ volumePercent }) => (volumePercent != null ? `${volumePercent}%` : `0%`)};
	}

	& > div:last-of-type {
		text-align: right;
	}

	& > div {
		flex: 1;
		text-align: left;
		z-index: 1;
	}
`;
const Container = styled.div<{
	fitContent?: boolean;
	reverse?: boolean;
}>`
	display: flex;
	flex-direction: column;
	justify-content: center;
	width: 100%;
	${({ fitContent }) => !fitContent && "height: 100%;"};
	${({ reverse }) => reverse && "flex-direction: column-reverse;"};
	height: 100%;
`;

const SpreadRow = styled(Row)`
	padding-left: 12px;
	height: 24px;
	background: ${({ theme }) => theme.colors.bgPrimary};
	align-items: center;
`;

const OrderBook: React.FC<IProps> = observer(({ mobileMode }) => {
	const vm = useTradeScreenVM();
	const [round] = useState("2");
	const { ordersStore } = useStores();
	const [orderFilter] = useState(0);
	const theme = useTheme();
	const [amountOfOrders, setAmountOfOrders] = useState(0);
	const oneSizeOrders = +new BN(amountOfOrders).div(2).toFixed(0) - 1;
	const calcSize = () => {
		// 48 + 50 + 4 + 26 + (12 + 32 + 8 + 16 + 24); //220
		// 48 + 50 + 4 + 26 + (12 + 32 + 8 + 32 + 8 + 16 + 24); //260
		// const windowHeight = window.innerHeight - (mobileMode ? window.innerHeight / 2 + 96 : 212);
		const amountOfOrders = +new BN(window.innerHeight - 220).div(17).toFixed(0);
		setAmountOfOrders(amountOfOrders);
	};

	useEffect(calcSize, [mobileMode]);
	const handleResize = useCallback(calcSize, []);

	useEventListener("resize", handleResize);

	const buyOrders = ordersStore.orderbook.buy
		.slice()
		.sort((a, b) => {
			if (a.price == null && b.price == null) return 0;
			if (a.price == null && b.price != null) return 1;
			if (a.price == null && b.price == null) return -1;
			return a.price < b.price ? 1 : -1;
		})
		.reverse()
		.slice(orderFilter === 0 ? -oneSizeOrders : -amountOfOrders)
		.reverse();
	const sellOrders = ordersStore.orderbook.sell
		.slice()
		.sort((a, b) => {
			if (a.price == null && b.price == null) return 0;
			if (a.price == null && b.price != null) return 1;
			if (a.price == null && b.price == null) return -1;
			return a.price < b.price ? 1 : -1;
		})
		.slice(orderFilter === 0 ? -oneSizeOrders : -amountOfOrders);

	const totalBuy = buyOrders.reduce((acc, order) => acc.plus(order.amountLeft), BN.ZERO);
	const totalSell = sellOrders.reduce((acc, order) => acc.plus(order.amountLeft), BN.ZERO);
	if (ordersStore.orderbook.buy.length === 0 && ordersStore.orderbook.sell.length === 0)
		return (
			<Root alignItems="center" justifyContent="center">
				<Text type={TEXT_TYPES.H}>No orders for this pair</Text>
			</Root>
		);
	else
		return (
			<Root>
				<OrderBookHeader>
					<Text type={TEXT_TYPES.SUPPORTING}>Amount {vm.token0.symbol}</Text>
					<Text type={TEXT_TYPES.SUPPORTING}>Total {vm.token1.symbol}</Text>
					<Text type={TEXT_TYPES.SUPPORTING}>Price {vm.token1.symbol}</Text>
				</OrderBookHeader>
				{/*<Divider />*/}
				<SizedBox height={8} />
				<Container fitContent={orderFilter === 1 || orderFilter === 2} reverse={orderFilter === 1}>
					{!ordersStore.initialized ? (
						<Skeleton height={20} style={{ marginBottom: 4 }} count={15} />
					) : (
						<>
							{orderFilter === 0 && (
								<Plug length={sellOrders.length < +oneSizeOrders ? +oneSizeOrders - 1 - sellOrders.length : 0} />
							)}
							{orderFilter !== 2 &&
								sellOrders.map((o, index) => (
									<OrderRow
										type="sell"
										fulfillPercent={+new BN(o.fullFillPercent).toFormat(2)}
										volumePercent={o.amountLeft.div(totalSell).times(100).toNumber()}
										key={index + "negative"}
										onClick={() => {
											const price = BN.parseUnits(o.price, vm.token1.decimals);
											vm.setIsSell(false);
											vm.setBuyPrice(price, true);
											// vm.setSellAmpount(new BN(o.amount), true);
											vm.setSellPrice(BN.ZERO, true);
											vm.setSellAmount(BN.ZERO, true);
											vm.setSellTotal(BN.ZERO, true);
										}}
									>
										<span className="progress-bar" />
										<span className="volume-bar" />
										<Text primary>{o.amountLeftStr}</Text>
										<Text primary>{o.totalLeftStr}</Text>
										<Text color={theme.colors.redLight}>{new BN(o.price).toFormat(+round)}</Text>
									</OrderRow>
								))}
						</>
					)}
					{/*{orderFilter === 0 && (*/}
					{/*	<>*/}
					{/*		<SizedBox height={8} />*/}
					{/*		/!*<Divider />*!/*/}
					{/*		<SizedBox height={8} />*/}
					{/*	</>*/}
					{/*)}*/}
					<Row>
						{!ordersStore.initialized ? (
							<>
								<Skeleton height={20} />
								<div />
								<Skeleton height={20} />
							</>
						) : (
							<SpreadRow>
								<Text type={TEXT_TYPES.SUPPORTING}>SPREAD</Text>
								<SizedBox width={12} />
								<Text primary>{ordersStore.spreadPrice}</Text>
								<SizedBox width={12} />
								<Text color={+ordersStore.spreadPercent > 0 ? theme.colors.greenLight : theme.colors.redLight}>
									{`(${+ordersStore.spreadPercent > 0 ? "+" : ""}${ordersStore.spreadPercent}%) `}
								</Text>
							</SpreadRow>
						)}
					</Row>
					{/*{orderFilter === 0 && (*/}
					{/*	<>*/}
					{/*		<SizedBox height={8} />*/}
					{/*		/!*<Divider />*!/*/}
					{/*		<SizedBox height={8} />*/}
					{/*	</>*/}
					{/*)}*/}
					{!ordersStore.initialized ? (
						<Skeleton height={20} style={{ marginBottom: 4 }} count={15} />
					) : (
						<>
							{orderFilter !== 1 &&
								buyOrders.map((o, index) => (
									<OrderRow
										onClick={() => {
											const price = BN.parseUnits(o.price, vm.token1.decimals);
											vm.setIsSell(true);
											vm.setSellPrice(price, true);
											vm.setBuyPrice(BN.ZERO, true);
											vm.setBuyAmount(BN.ZERO, true);
											vm.setBuyTotal(BN.ZERO, true);
										}}
										fulfillPercent={+new BN(o.fullFillPercent).toFormat(0)}
										volumePercent={o.amountLeft.div(totalBuy).times(100).toNumber()}
										type="buy"
										key={index + "positive"}
									>
										<span className="progress-bar" />
										<span className="volume-bar" />
										<Text primary>{o.totalLeftStr}</Text>
										<Text primary>{o.amountLeftStr}</Text>
										<Text color={theme.colors.greenLight}>{new BN(o.price).toFormat(+round)}</Text>
									</OrderRow>
								))}
							{orderFilter === 0 && (
								<Plug length={buyOrders.length < +oneSizeOrders ? +oneSizeOrders - 1 - buyOrders.length : 0} />
							)}
						</>
					)}
				</Container>
			</Root>
		);
});
export default OrderBook;

const PlugRow = styled(Row)`
	justify-content: space-between;
	margin-bottom: 1px;
	height: 16px;
	padding: 0 12px;
	box-sizing: border-box;
`;

const Plug: React.FC<{
	length: number;
}> = ({ length }) => (
	<>
		{Array.from({ length }).map((_, index) => (
			<PlugRow key={index + "positive-plug"}>
				<Text>-</Text>
				<Text>-</Text>
				<Text>-</Text>
			</PlugRow>
		))}
	</>
);
