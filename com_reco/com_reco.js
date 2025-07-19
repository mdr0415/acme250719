// HTML 요소 선택
const outputElement = document.getElementById('output');
const searchInput = document.getElementById('searchInput');
const provinceFilter = document.getElementById('provinceFilter');
const cityFilter = document.getElementById('cityFilter');
const paginationElement = document.getElementById('pagination');
const loadingElement = document.getElementById('loading');

// 전역 변수
let allData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;

// Excel 파일 로드
async function loadExcel() {
    try {
        // 로딩 시작
        loadingElement.style.display = 'block';
        
        const url = './company.xlsx';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('파일을 찾을 수 없습니다');
        }
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, {type: 'array'});
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        allData = XLSX.utils.sheet_to_json(worksheet);

        // 주소 데이터 처리 및 필터 설정
        setupAddressFilters();
        
        // 초기 데이터 표시
        filterAndDisplayData();

        // 로딩 완료 후 숨김
        loadingElement.style.display = 'none';

    } catch (error) {
        console.error('Error loading excel file:', error);
        outputElement.innerHTML = `
            <div class="text-center py-8">
                <p class="text-red-500 text-lg">데이터를 불러오는데 실패했습니다.</p>
                <p class="text-gray-600 mt-2">잠시 후 다시 시도해 주세요.</p>
            </div>
        `;
        // 에러 발생 시에도 로딩 숨김
        loadingElement.style.display = 'none';
    }
}

// 주소 필터 설정을 별도 함수로 분리
function setupAddressFilters() {
    const addressMap = new Map();
    allData.forEach(item => {
        if (item.adress) {
            const addressParts = item.adress.split(' ');
            if (addressParts.length >= 2) {
                const province = addressParts[0];
                const city = addressParts[1];
                
                if (!addressMap.has(province)) {
                    addressMap.set(province, new Set());
                }
                if (city) {
                    addressMap.get(province).add(city);
                }
            }
        }
    });

    // 시/도 순서 정의
    const provinceOrder = ['전북', '광주', '서울', '경기', '인천', '부산'];
    
    // 시/도 필터 옵션 설정
    provinceFilter.innerHTML = '<option value="">전체 시/도</option>' +
        provinceOrder
            .filter(province => addressMap.has(province))
            .map(province => `<option value="${province}">${province}</option>`)
            .join('');

    // 이벤트 리스너 설정
    provinceFilter.addEventListener('change', () => {
        const selectedProvince = provinceFilter.value;
        let cities = [];
        
        if (selectedProvince && addressMap.has(selectedProvince)) {
            cities = Array.from(addressMap.get(selectedProvince)).sort();
        }
        
        cityFilter.innerHTML = '<option value="">전체 시/군/구</option>' +
            cities.map(city => `<option value="${city}">${city}</option>`).join('');
        
        filterAndDisplayData();
    });

    cityFilter.addEventListener('change', filterAndDisplayData);
    searchInput.addEventListener('input', filterAndDisplayData);
}

// 로딩 상태 표시
function showLoading() {
    outputElement.innerHTML = `
        <div class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p class="mt-4 text-gray-600">기업 정보를 불러오는 중입니다...</p>
        </div>
    `;
}

// 데이터 필터링 및 표시
function filterAndDisplayData() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedProvince = provinceFilter.value;
    const selectedCity = cityFilter.value;

    filteredData = allData.filter(item => {
        if (!item.adress) return false;
        
        const addressParts = item.adress.split(' ');
        const provinceMatch = !selectedProvince || addressParts[0] === selectedProvince;
        const cityMatch = !selectedCity || (addressParts.length >= 2 && addressParts[1] === selectedCity);
        const searchMatch = !searchTerm || 
            (item.name && item.name.toLowerCase().includes(searchTerm));
        
        return provinceMatch && cityMatch && searchMatch;
    });

    currentPage = 1;
    displayData();
}

// 데이터 표시
function displayData() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    
    outputElement.innerHTML = filteredData.slice(startIndex, endIndex)
        .map((item, index) => `
            <div class="bg-gray-50 rounded-xl shadow-md p-6 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-lg">
                <div class="space-y-2">
                    <p class="text-gray-700">No. ${startIndex + index + 1}</p>
                    <h3 class="text-xl font-semibold text-gray-700">${item.name || ''}</h3>
                    <p class="text-gray-600">주소: ${item.adress || ''}</p>
                </div>
            </div>
        `).join('');

    setupPagination();
}

// 페이지네이션 설정
function setupPagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    paginationElement.innerHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} 
                onclick="changePage(${currentPage - 1})" 
                class="btn_page prev bg-gray-50 rounded-lg px-6 py-2 text-gray-700 font-medium transition-all duration-200 hover:bg-blue-500 hover:text-white ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
            이전
        </button>
        <div class="page_num text-gray-700">
            <strong id="currentPage" class="text-blue-600">${currentPage}</strong> / <span id="totalPages">${totalPages}</span>
        </div>
        <button ${currentPage === totalPages ? 'disabled' : ''} 
                onclick="changePage(${currentPage + 1})" 
                class="btn_page next bg-gray-50 rounded-lg px-6 py-2 text-gray-700 font-medium transition-all duration-200 hover:bg-blue-500 hover:text-white ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
            다음
        </button>
    `;
}

// 페이지 변경
function changePage(page) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayData();
        window.scrollTo(0, 0);
    }
}

// 초기 로드
loadingElement.style.display = 'block';
loadExcel();
