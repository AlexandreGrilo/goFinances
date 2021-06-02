import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'styled-components';

import { HighlightCard } from '../../components/HighlightCard';
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';

import { 
    Container,
    LoadContainer,
    Header,
    UserWrapper,
    UserInfo,
    Photo,
    User,
    UserGreeting,
    Username,
    LogoutButton,
    Icon,
    HighlightCards,
    Transactions,
    Title,
    TransactionsList
} from './styles';

export interface DataListProps extends TransactionCardProps {
    id: string;
}

interface HighlightCardProps {
    amount: string;
    lastTransaction: string;
}

interface HighlightCardData {
    incomes: HighlightCardProps;
    outcomes: HighlightCardProps;
    total: HighlightCardProps;
}

export function Dashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState<DataListProps[]>([]);
    const [highlightCardData, setHighlightCardData] = useState<HighlightCardData>({} as HighlightCardData);
    
    const theme = useTheme();

    const deviceLanguage = 'en-EN';
    //   Platform.OS === 'ios'
    //     ? NativeModules.SettingsManager.settings.AppleLocale ||
    //       NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
    //     : NativeModules.I18nManager.localeIdentifier;
    
    // console.log(deviceLanguage);

    function getLastTransactionDate(
        collection: DataListProps[],
        type: 'positive' | 'negative'
    ) {
        const lastTransaction = new Date(
            Math.max.apply(Math, collection
                .filter(transaction => transaction.type === type)
                .map(transaction => new Date(transaction.date).getTime()))
        );
        return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', { month: 'long' })}`;
    }

    async function loadTransactions() {
        const dataKey = '@gofinances:transactions';
        const response = await AsyncStorage.getItem(dataKey);
        const transactions = response ? JSON.parse(response) : [];

        let incomesTotal = 0;
        let outcomesTotal = 0;

        const transactionsFormatted: DataListProps[] = transactions.map((item: DataListProps) => {

            if(item.type === 'positive') {
                incomesTotal += Number(item.amount);
            }
            else {
                outcomesTotal += Number(item.amount);
            }

            const amount = Number(item.amount).toLocaleString(deviceLanguage, {
                style: 'currency',
                currency: 'EUR'
            });

            const date = Intl.DateTimeFormat(deviceLanguage, {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            }).format(new Date(item.date));

            return {
                id: item.id,
                name: item.name,
                amount,
                date,
                type: item.type,
                category: item.category
            }
        });

        setTransactions(transactionsFormatted);

        const lastTransactionIncome = getLastTransactionDate(transactionsFormatted, 'positive');
        const lastTransactionOutcome = getLastTransactionDate(transactionsFormatted, 'negative');

        const total = incomesTotal - outcomesTotal;

        setHighlightCardData({
            incomes: {
                amount: incomesTotal.toLocaleString(deviceLanguage, {
                    style: 'currency',
                    currency: 'EUR'
                }),
                lastTransaction: `Última entrada dia ${lastTransactionIncome}`
            },
            outcomes: {
                amount: outcomesTotal.toLocaleString(deviceLanguage, {
                    style: 'currency',
                    currency: 'EUR'
                }),
                lastTransaction: `Última saída dia ${lastTransactionOutcome}`
            },
            total: {
                amount: total.toLocaleString(deviceLanguage, {
                    style: 'currency',
                    currency: 'EUR'
                }),
                lastTransaction: `01 à ${lastTransactionIncome}`
            }
        });

        setIsLoading(false);
    }

    // useEffect(() => {
    //     loadTransactions();
    // }, []);

    useFocusEffect(useCallback(() => {
        loadTransactions();
    },[]));

    return(
        <Container>
            {
                isLoading ? 
                    <LoadContainer>
                        <ActivityIndicator 
                            color={theme.colors.primary}
                            size='large'
                        />
                    </LoadContainer> : 
                    <>
                        <Header>
                            <UserWrapper>
                                <UserInfo>
                                    <Photo 
                                        source={{ uri: 'https://github.com/AlexandreGrilo.png'}}
                                    />
                                    <User>
                                        <UserGreeting>
                                            Olá,
                                        </UserGreeting>
                                        <Username>
                                            Alexandre
                                        </Username>
                                    </User>
                                </UserInfo>
                                
                                <LogoutButton onPress={() => {}}>
                                    <Icon name="power" />
                                </LogoutButton>
                            </UserWrapper>
                        </Header>

                        <HighlightCards>
                            <HighlightCard
                                type="up"
                                title="Entradas"
                                amount={highlightCardData.incomes.amount}
                                lastTransaction={highlightCardData.incomes.lastTransaction}
                            />
                            <HighlightCard
                                type="down"
                                title="Saídas"
                                amount={highlightCardData.outcomes.amount}
                                lastTransaction={highlightCardData.outcomes.lastTransaction}
                            />
                            <HighlightCard
                                type="total"
                                title="Total"
                                amount={highlightCardData.total.amount}
                                lastTransaction={highlightCardData.total.lastTransaction}
                            />
                        </HighlightCards>

                        <Transactions>
                            <Title>
                                Listagem
                            </Title>

                            <TransactionsList 
                                data={transactions}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => <TransactionCard data={item} />}
                            />
                            
                        </Transactions>
                    </>
            }
        </Container>
    )
}