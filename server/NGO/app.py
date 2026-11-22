import pandas as pd
import plotly.graph_objs as go
from dash import Dash, dcc, html
from flask import Flask
from pathlib import Path

DATA = Path(__file__).parent / "data"  

# Flask server
server = Flask(__name__)

# Dash app
app = Dash(__name__, server=server, use_pages=False, suppress_callback_exceptions=True)
app.title = "NGO Impact Assessment Dashboard"

# Load datasets (same as CSR)
trionyx = pd.read_csv(DATA / "TrionyxSystemsWorldwide.csv")
zentara = pd.read_csv(DATA / "ZentaraDynamicsCorporation.csv")
aurevia = pd.read_csv(DATA / "AureviaInternationalHoldings.csv")
noventra = pd.read_csv(DATA / "NoventraTechnologiesInc.csv")
veltrix = pd.read_csv(DATA / "VeltrixGlobalSolutions.csv")

def kpi_summary(label, value, unit=""):
    return html.Div([
        html.H4(label),
        html.P(f"{value:,} {unit}", style={"fontWeight": "bold", "fontSize": "20px"})
    ], className="kpi-card")

# --- Trionyx (Maha NGO) ---
def trionyx_graphs():
    df = trionyx.copy()
    water = df['WaterDeliveredLiters'].sum()
    households = df['HouseholdsReached'].sum()
    hygiene_kits = df['HygieneKitsDistributed'].sum()
    tankers = df['TankersSupplied'].sum()

    fig1 = go.Figure([go.Scatter(x=df.index, y=df['WaterDeliveredLiters'], mode='lines+markers')])
    fig1.update_layout(title='Water Delivered per Event', template='plotly_dark')

    fig2 = go.Figure([go.Scatter(x=df.index, y=df['HouseholdsReached'], mode='lines+markers')])
    fig2.update_layout(title='Households Reached per Event', template='plotly_dark')

    return [
        html.Div([
            kpi_summary("Water Delivered (Liters)", water),
            kpi_summary("Households Reached", households),
            kpi_summary("Hygiene Kits Distributed", hygiene_kits),
            kpi_summary("Tankers Supplied", tankers),
        ], className="kpi-row"),
        dcc.Graph(figure=fig1, className="dash-graph"),
        dcc.Graph(figure=fig2, className="dash-graph")
    ]

# --- Zentara (Tamil NGO) ---
def zentara_graphs():
    df = zentara.copy()
    pits = df['PitsInstalled'].sum()
    storage = df['EstimatedStorageLitersPerMonth'].sum()
    structures = df['StructureType'].nunique()
    govt_install = (df['InstallationBy'] == 'Govt.').sum()

    fig1 = go.Figure([go.Scatter(x=df.index, y=df['PitsInstalled'], mode='lines+markers')])
    fig1.update_layout(title='Pits Installed per Event', template='plotly_dark')

    fig2 = go.Figure([go.Scatter(x=df.index, y=df['EstimatedStorageLitersPerMonth'], mode='lines+markers')])
    fig2.update_layout(title='Estimated Storage per Event', template='plotly_dark')

    return [
        html.Div([
            kpi_summary("Pits Installed", pits),
            kpi_summary("Storage Capacity (L/month)", storage),
            kpi_summary("Structure Types", structures),
            kpi_summary("Govt. Installations", govt_install),
        ], className="kpi-row"),
        dcc.Graph(figure=fig1, className="dash-graph"),
        dcc.Graph(figure=fig2, className="dash-graph")
    ]

# --- Aurevia (Rajasthan NGO) ---
def aurevia_graphs():
    df = aurevia.copy()
    trees = df['TreesPlanted'].sum()
    survival = df['SaplingSurvivalRatePercent'].mean()
    diversity = df['SpeciesDiversityCount'].mean()
    geotag = df['GeoTaggingEnabled'].sum()

    fig1 = go.Figure([go.Scatter(x=df.index, y=df['TreesPlanted'], mode='lines+markers')])
    fig1.update_layout(title='Trees Planted per Event', template='plotly_dark')

    fig2 = go.Figure([go.Scatter(x=df.index, y=df['SaplingSurvivalRatePercent'], mode='lines+markers')])
    fig2.update_layout(title='Sapling Survival Rate (%)', template='plotly_dark')

    return [
        html.Div([
            kpi_summary("Trees Planted", trees),
            kpi_summary("Avg. Survival Rate (%)", round(survival, 2), "%"),
            kpi_summary("Species Diversity", round(diversity, 2)),
            kpi_summary("Geo-tagged Events", geotag),
        ], className="kpi-row"),
        dcc.Graph(figure=fig1, className="dash-graph"),
        dcc.Graph(figure=fig2, className="dash-graph")
    ]

# --- Noventra (WB NGO) ---
def noventra_graphs():
    df = noventra.copy()
    area = df['AreaRestoredSqM'].sum()
    flora = df['NativeFloraPlanted'].sum()
    waste = df['WasteRemovedKg'].sum()
    species = df['BiodiversitySpeciesCount'].mean()

    fig1 = go.Figure([go.Scatter(x=df.index, y=df['AreaRestoredSqM'], mode='lines+markers')])
    fig1.update_layout(title='Area Restored (Sq. M)', template='plotly_dark')

    fig2 = go.Figure([go.Scatter(x=df.index, y=df['NativeFloraPlanted'], mode='lines+markers')])
    fig2.update_layout(title='Native Flora Planted', template='plotly_dark')

    return [
        html.Div([
            kpi_summary("Area Restored (Sq. M)", area),
            kpi_summary("Flora Planted", flora),
            kpi_summary("Waste Removed (Kg)", waste),
            kpi_summary("Avg. Biodiversity Count", round(species, 2)),
        ], className="kpi-row"),
        dcc.Graph(figure=fig1, className="dash-graph"),
        dcc.Graph(figure=fig2, className="dash-graph")
    ]

# --- Veltrix (Assam NGO) ---
def veltrix_graphs():
    df = veltrix.copy()
    households = df['HouseholdsCovered'].sum()
    kits = df['AwarenessKitsDistributed'].sum()
    drills = df['MockDrillsConducted'].sum()
    warning = df['EarlyWarningSystemInstalled'].sum()

    fig1 = go.Figure([go.Scatter(x=df.index, y=df['HouseholdsCovered'], mode='lines+markers')])
    fig1.update_layout(title='Households Covered per Event', template='plotly_dark')

    fig2 = go.Figure([go.Scatter(x=df.index, y=df['AwarenessKitsDistributed'], mode='lines+markers')])
    fig2.update_layout(title='Awareness Kits Distributed per Event', template='plotly_dark')

    return [
        html.Div([
            kpi_summary("Households Covered", households),
            kpi_summary("Awareness Kits", kits),
            kpi_summary("Mock Drills", drills),
            kpi_summary("Early Warning Installed", warning),
        ], className="kpi-row"),
        dcc.Graph(figure=fig1, className="dash-graph"),
        dcc.Graph(figure=fig2, className="dash-graph")
    ]

# --- App Layout ---
app.layout = html.Div([
    html.H1("NGO Impact Assessment Dashboard", style={"textAlign": "center"}),
    dcc.Tabs([
        dcc.Tab(label='Maharashtra NGO - Emergency water supply and Drought relief drives, Maharashtra', children=trionyx_graphs(), className='tab', selected_className='tab--selected'),
        dcc.Tab(label='Tamil NGO - Rainwater Harvesting Pits Installation Drive, Tamil Nadu', children=zentara_graphs(), className='tab', selected_className='tab--selected'),
        dcc.Tab(label='Rajasthan NGO - Tree Plantation Drive, Rajasthan', children=aurevia_graphs(), className='tab', selected_className='tab--selected'),
        dcc.Tab(label='West Bengal NGO - Riverbank and Wetland Restoration Campaigns, West Bengal', children=noventra_graphs(), className='tab', selected_className='tab--selected'),
        dcc.Tab(label='Assam NGO - Flood Preparedness and Early Warning Awareness Drives, Assam', children=veltrix_graphs(), className='tab', selected_className='tab--selected'),
    ])
])

if __name__ == '__main__':
    app.run(debug=True, port=8050)
