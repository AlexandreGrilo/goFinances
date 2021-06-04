import React, { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/core';
import { VictoryPie } from 'victory-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useTheme } from 'styled-components';
import { useAuth } from '../../hooks/auth';

import { categories } from '../../utils/categories';

import { HistoryCard } from '../../components/HistoryCard';

import {
    Container,
    Header,
    Title,
    LoadContainer,
    Content,
    CharContainer,
    MonthSelect,
    MonthSelectButton,
    MonthSelectIcon,
    Month
} from './styles';


interface TransactionData {
    type: 'positive' | 'negative';
    name: string;
    amount: string;
    category: string;
    date: string;
}

interface CategoryData {
    key: string;
    name: string;
    color: string;
    total: number;
    totalFormatted: string;
    percentFormatted: string;
    percent: number;
}

export function Resume(){
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [totalByCategories, setTotalByCategories] = useState<CategoryData[]>([]);

    const { user } = useAuth();

    const theme = useTheme();

    function handleDateChange(action: 'next' | 'prev') {
        if(action === 'next'){
            setSelectedDate(addMonths(selectedDate, 1));
        } else {
            setSelectedDate(subMonths(selectedDate, 1));
        }
    }

    async function loadData() {
        setIsLoading(true);
        const dataKey = `@gofinances:transactions_user:${user.id}`;
        const response = await AsyncStorage.getItem(dataKey);
        const responseFormatted = response ? JSON.parse(response) : [];

        const outcomes = responseFormatted
        .filter((outcome: TransactionData) => 
            outcome.type === 'negative' &&
            new Date(outcome.date).getMonth() === selectedDate.getMonth() &&
            new Date(outcome.date).getFullYear() === selectedDate.getFullYear()
        );

        const outcomesTotal = outcomes
        .reduce((accumulator: number, outcome: TransactionData) => {
            return accumulator + Number(outcome.amount);
        }, 0);
        
        const totalByCategory: CategoryData[] = [];

        categories.forEach(category => {
            let categorySum = 0;

            outcomes.forEach((outcome: TransactionData) => {
                if(outcome.category === category.key) {
                    categorySum += Number(outcome.amount);
                }
            });

            if(categorySum > 0) {
                const totalFormatted = categorySum.toLocaleString('en-EN', {
                    style: 'currency',
                    currency: 'EUR'
                });

                const percent = (categorySum / outcomesTotal * 100);
                const percentFormatted = `${percent.toFixed(0)}%`;

                totalByCategory.push({
                    key: category.key,
                    name: category.name,
                    color: category.color,
                    total: categorySum,
                    totalFormatted,
                    percent,
                    percentFormatted
                });
            }
        });

        setTotalByCategories(totalByCategory);
        setIsLoading(false);
    }

    useFocusEffect(useCallback(() => {
        loadData();
    },[selectedDate]));

    return(
        <Container>
            <Header> 
                <Title>
                    Resumo por categoria
                </Title>
            </Header>
            
            {
                isLoading ? 
                    <LoadContainer>
                        <ActivityIndicator 
                            color={theme.colors.primary}
                            size='large'
                        />
                    </LoadContainer> : 
            
                    <Content
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingHorizontal: 24,
                            paddingBottom: useBottomTabBarHeight(),
                        }}
                    >
                        <MonthSelect>
                            <MonthSelectButton onPress={() => handleDateChange('prev')}>
                                <MonthSelectIcon name="chevron-left" />
                            </MonthSelectButton>

                            <Month>
                                { format(selectedDate, 'MMMM, yyyy', {locale: ptBR}) }
                            </Month>

                            <MonthSelectButton onPress={() => handleDateChange('next')}>
                                <MonthSelectIcon name="chevron-right" />
                            </MonthSelectButton>
                        </MonthSelect>

                        <CharContainer>
                            <VictoryPie
                                data={totalByCategories}
                                colorScale={totalByCategories.map(category => category.color)}
                                style={{
                                    labels: {
                                        fontSize: RFValue(18),
                                        fontWeight: 'bold',
                                        fill: theme.colors.shape
                                    }
                                }}
                                labelRadius={80}
                                x="percentFormatted"
                                y="total"
                            />
                        </CharContainer>
                        {
                            totalByCategories.map(item => (
                                <HistoryCard
                                    key={item.key}
                                    title={item.name}
                                    color={item.color}
                                    amount={item.totalFormatted}
                                />
                            ))
                        }
                    </Content>
            }
        </Container>
    )
}