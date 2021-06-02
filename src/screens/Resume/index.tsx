import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HistoryCard } from '../../components/HistoryCard';

import {
    Container,
    Header,
    Title,
    Content
} from './styles';

import { categories } from '../../utils/categories';

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
    total: string;
    percentFormatted: string;
    percent: number;
}

export function Resume(){
    const [totalByCategories, setTotalByCategories] = useState<CategoryData[]>([]);

    async function loadData() {
        const dataKey = '@gofinances:transactions';
        const response = await AsyncStorage.getItem(dataKey);
        const responseFormatted = response ? JSON.parse(response) : [];

        const outcomes = responseFormatted
        .filter((outcome: TransactionData) => outcome.type === 'negative');

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
                const total = categorySum.toLocaleString('en-EN', {
                    style: 'currency',
                    currency: 'EUR'
                });

                const percent = (categorySum / outcomesTotal * 100);
                const percentFormatted = `${percent.toFixed(0)}%`;

                totalByCategory.push({
                    key: category.key,
                    name: category.name,
                    color: category.color,
                    total,
                    percent,
                    percentFormatted
                });
            }
        });

        console.log(totalByCategory);

        setTotalByCategories(totalByCategory);
    }
    
    useEffect(() => {
        loadData();
    },[]);

    return(
        <Container>
            <Header>
                <Title>
                    Resumo por categoria
                </Title>
            </Header>
            
            <Content>
                {
                    totalByCategories.map(item => (
                        <HistoryCard
                            key={item.key}
                            title={item.name}
                            color={item.color}
                            amount={item.total}
                        />
                    ))
                }
            </Content>
        </Container>
    )
}