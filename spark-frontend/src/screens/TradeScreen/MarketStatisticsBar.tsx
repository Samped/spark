import styled from "@emotion/styled";
import { Column, Row } from "@src/components/Flex";
import React, { useEffect, useState } from "react";
import SizedBox from "@components/SizedBox";
import { TOKENS_BY_SYMBOL } from "@src/constants";
import Text, { TEXT_TYPES } from "@components/Text";
import { useTheme } from "@emotion/react";
import Button from "@components/Button";
import dayjs from "dayjs";
import axios from "axios";
import BN from "@src/utils/BN";
import { observer } from "mobx-react";
import { useTradeScreenVM } from "@screens/TradeScreen/TradeScreenVm";

interface IProps {}

const Root = styled.div`
	display: flex;
	align-items: center;
	box-sizing: border-box;
	height: 50px;
	width: 100%;
	background: ${({ theme }) => theme.colors.gray4};
	border-radius: 10px;
	flex-shrink: 0;
`;

const MarketSelect = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 16px;
	box-sizing: border-box;
	flex: 2;
	max-width: 280px;
	height: 100%;
`;

const MarketStatistics = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 16px;
	flex: 7;
	box-sizing: border-box;
	width: 100%;
`;

interface IState {
	price?: BN;
	priceChange?: BN;
	high?: BN;
	low?: BN;
	volumeAsset0?: BN;
	volumeAsset1?: BN;
}

const MarketStatisticsBar: React.FC<IProps> = observer(() => {
	const vm = useTradeScreenVM();
	const theme = useTheme();
	let [state, setState] = useState<IState>({});
	useEffect(() => {
		const to = dayjs().unix();
		const from = to - 60 * 60 * 24 * 2;
		const req = `https://spark-tv-datafeed.spark-defi.com/api/v1/history?symbol=UNI%2FUSDC&resolution=1D&from=${from}&to=${to}&countback=2&currencyCode=USDC`;
		axios
			.get(req)
			.then((res) => res.data)
			.then((data) => {
				if (data.h[1] != null && data.h[0] != null) {
					setState({
						price: new BN(data.c[1]),
						priceChange: new BN(new BN(data.c[1]).minus(data.c[0])).div(data.c[0]).times(100),
						high: new BN(data.h[1]),
						low: new BN(data.l[1]),
						//fixme
						volumeAsset1: BN.formatUnits(data.v[1] * data.c[1], 9), //data.c[1] = price of USDC
						volumeAsset0: BN.formatUnits(data.v[1] * 1, 9), //1 = price of USDC
					});
				} else if (data.h[0] != null && data.h[1] == null) {
					setState({
						price: new BN(data.c[0]),
						// priceChange: new BN(new BN(data.c[1]).minus(data.c[0])).div(data.c[0]).times(100),
						high: new BN(data.h[0]),
						low: new BN(data.l[0]),
						//fixme
						volumeAsset1: BN.formatUnits(data.v[0] * data.c[0], 9), //data.c[1] = price of USDC
						volumeAsset0: BN.formatUnits(data.v[0] * 1, 9), //1 = price of USDC
					});
				}
			});
	}, []);
	return (
		<Root>
			<MarketSelect>
				<Row alignItems="center">
					<img style={{ width: 24, height: 24 }} src={TOKENS_BY_SYMBOL.UNI.logo} alt="btc" />
					<img style={{ width: 24, height: 24, marginLeft: -8 }} src={TOKENS_BY_SYMBOL.USDC.logo} alt="btc" />
					<SizedBox width={8} />
					<Text type={TEXT_TYPES.H1}>UNI / USDC</Text>
				</Row>
				{/*<h4 style={{ transform: "rotate(90deg)" }}>{">"}</h4>*/}
			</MarketSelect>
			<SizedBox width={1} height={32} style={{ background: theme.colors.gray5 }} />
			<MarketStatistics>
				<Row alignItems="center">
					<Column alignItems="flex-end">
						<Text type={TEXT_TYPES.NUMBER_LARGE}>
							{state.price?.toFormat(2) ?? "-"}&nbsp;{vm.token1.symbol}
						</Text>
						<Text
							type={TEXT_TYPES.NUMBER_SMALL}
							color={state.priceChange?.isPositive() ? theme.colors.green : theme.colors.red}
						>
							{state.priceChange?.toFormat(2) ?? "-"}&nbsp;%
						</Text>
					</Column>
					<SizedBox width={1} height={32} style={{ background: theme.colors.gray5, margin: "0 12px" }} />
					<Column>
						<Text type={TEXT_TYPES.LABEL} color={theme.colors.gray2}>
							24h High
						</Text>
						<SizedBox height={4} />
						<Text type={TEXT_TYPES.NUMBER_SMALL}>
							{state.high?.toFormat(2) ?? "-"}&nbsp;{vm.token1.symbol}
						</Text>
					</Column>
					<SizedBox width={1} height={32} style={{ background: theme.colors.gray5, margin: "0 12px" }} />{" "}
					<Column>
						<Text type={TEXT_TYPES.LABEL} color={theme.colors.gray2}>
							24h Low
						</Text>
						<SizedBox height={4} />
						<Text type={TEXT_TYPES.NUMBER_SMALL}>
							{state.low?.toFormat(2) ?? "-"}&nbsp;{vm.token1.symbol}
						</Text>
					</Column>
					<SizedBox width={1} height={32} style={{ background: theme.colors.gray5, margin: "0 12px" }} />
					<Column>
						<Text type={TEXT_TYPES.LABEL} color={theme.colors.gray2}>
							Volume 24h (USDC)
						</Text>
						<SizedBox height={4} />
						<Text type={TEXT_TYPES.NUMBER_SMALL}>{state.volumeAsset1?.toFormat(2) ?? "-"}</Text>
					</Column>{" "}
					<SizedBox width={1} height={32} style={{ background: theme.colors.gray5, margin: "0 12px" }} />
					<Column>
						<Text type={TEXT_TYPES.LABEL} color={theme.colors.gray2}>
							Volume 24h (UNI)
						</Text>
						<SizedBox height={4} />
						<Text type={TEXT_TYPES.NUMBER_SMALL}>{state.volumeAsset0?.toFormat(2) ?? "-"}</Text>
					</Column>
				</Row>
				<Button fitContent outline disabled>
					SEE ALL MARKET DETAILS
				</Button>
			</MarketStatistics>
		</Root>
	);
});
export default MarketStatisticsBar;
